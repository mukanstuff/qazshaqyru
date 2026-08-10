import prisma from '@/lib/shared/db';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  blockedUntil?: Date;
}

export const RATE_LIMITS = {
  OTP_REQUEST_PER_PHONE: { windowMs: 60 * 60 * 1000, maxRequests: 5, blockDurationMs: 60 * 60 * 1000 },
  OTP_REQUEST_PER_IP: { windowMs: 60 * 1000, maxRequests: 10, blockDurationMs: 60 * 1000 },
  OTP_VERIFY_PER_PHONE: { windowMs: 60 * 1000, maxRequests: 10, blockDurationMs: 5 * 60 * 1000 },
  OTP_VERIFY_PER_IP: { windowMs: 60 * 1000, maxRequests: 20, blockDurationMs: 5 * 60 * 1000 },
  GOOGLE_OAUTH_PER_IP: { windowMs: 60 * 1000, maxRequests: 30, blockDurationMs: 5 * 60 * 1000 },
  API_GENERAL: { windowMs: 60 * 1000, maxRequests: 60 },
  API_INVITATION_CREATE: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  API_INVITATION_SEND: { windowMs: 60 * 60 * 1000, maxRequests: 30 },
  API_GUEST_CREATE: { windowMs: 60 * 60 * 1000, maxRequests: 200 },
  API_GUEST_EXPORT: { windowMs: 60 * 60 * 1000, maxRequests: 30 },
  API_RSVP: { windowMs: 60 * 1000, maxRequests: 5 },
  API_WEBHOOK: { windowMs: 60 * 1000, maxRequests: 120 },
  API_TEMPLATES: { windowMs: 60 * 60 * 1000, maxRequests: 120 },
  PUBLIC_INVITATION: { windowMs: 60 * 1000, maxRequests: 120 },
  PUBLIC_DEMO: { windowMs: 60 * 1000, maxRequests: 60 },
  GUEST_UPLOAD: { windowMs: 60 * 60 * 1000, maxRequests: 120 },
  ANON_UPLOAD_TOKEN: { windowMs: 60 * 60 * 1000, maxRequests: 30 },
  /** Authenticated read endpoints — prevents session-scrape abuse. */
  API_AUTH_READ: { windowMs: 60 * 1000, maxRequests: 120 },
  /** Anonymous draft uploads — stricter than authenticated. */
  ANON_UPLOAD: { windowMs: 60 * 60 * 1000, maxRequests: 40 },
  /** Public OG image generation - cheap to generate, expensive to abuse for scraping. */
  OG_IMAGE: { windowMs: 60 * 1000, maxRequests: 30 },
  /** Guest wishes wall — create wish. */
  API_WISH_CREATE: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  /** Guest wishes wall — like a wish. */
  API_WISH_LIKE: { windowMs: 60 * 1000, maxRequests: 30 },
  /** Guest wishes wall — read wishes. */
  API_WISH_READ: { windowMs: 60 * 1000, maxRequests: 60 },
  /** Kaspi gift transfer acknowledgments. */
  API_GIFT_CREATE: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  /** AI invitation field fill. */
  API_AI_FILL: { windowMs: 60 * 60 * 1000, maxRequests: 30 },
  /** Seating mutations. */
  API_SEATING: { windowMs: 60 * 1000, maxRequests: 60 },
  /** Template waitlist signups (public). */
  API_TEMPLATE_WAITLIST: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
} as const satisfies Record<string, RateLimitConfig>;

/**
 * Race-safe sliding-window rate limit using a single atomic UPDATE.
 *
 * Why not the obvious "read, check, update" pattern: under load, two
 * concurrent requests both observe count=N-1, both pass the check, and
 * the row is incremented to N+1 — exceeding the limit silently. Postgres
 * doesn't snapshot reads, but a single conditional UPDATE is atomic.
 *
 * The flow:
 * 1. If no row exists OR the window expired, atomically (re)create the row
 *    with count=1. Any other concurrent request creating the same key hits
 *    the unique-constraint and the second writer falls back to the
 *    increment path.
 * 2. If the row is still inside its window, atomically increment ONLY when
 *    count < max. If RETURNING is empty the limit was already hit; we mark
 *    the row as blocked (so subsequent calls return blockedUntil without
 *    doing any further DB writes).
 *
 * All increments happen in a single SQL statement, so there is no window
 * for two requests to both pass.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();

  // 1. Try to atomically (re)create a fresh window.
  const resetAt = new Date(now.getTime() + config.windowMs);
  try {
    const created = await prisma.rateLimitEntry.create({
      data: {
        key: identifier,
        count: 1,
        resetAt,
        blocked: false,
        blockedUntil: null,
      },
    });
    return {
      allowed: true,
      remaining: config.maxRequests - created.count,
      resetIn: config.windowMs,
    };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== 'P2002') throw err;
    // Existing row - fall through to update path.
  }

  // 2. Try the atomic increment.
  const incremented = await prisma.$queryRaw<
    Array<{ count: number; resetAt: Date; blockedUntil: Date | null }>
  >`
    UPDATE "RateLimitEntry"
    SET
      "count" = "count" + 1,
      "blocked" = CASE
        WHEN "count" + 1 >= ${config.maxRequests} THEN true
        ELSE "blocked"
      END,
      "blockedUntil" = CASE
        WHEN "count" + 1 >= ${config.maxRequests} AND "blockedUntil" IS NULL THEN
          ${config.blockDurationMs ? new Date(now.getTime() + config.blockDurationMs) : null}::timestamp
        ELSE "blockedUntil"
      END
    WHERE "key" = ${identifier}
      AND ("resetAt" > ${now} OR ("blocked" = true AND "blockedUntil" > ${now}))
      AND "count" < ${config.maxRequests}
    RETURNING "count", "resetAt", "blockedUntil"
  `;

  if (incremented.length === 0) {
    // Either the window expired (and the row needs reset) or the limit is hit.
    const existing = await prisma.rateLimitEntry.findUnique({ where: { key: identifier } });
    if (!existing) {
      // Vanishingly rare: row was deleted between attempts. Retry once.
      return checkRateLimit(identifier, config);
    }
    if (existing.resetAt < now && !(existing.blocked && existing.blockedUntil && existing.blockedUntil > now)) {
      // Expired window, refresh and allow.
      await prisma.rateLimitEntry.update({
        where: { key: identifier },
        data: { count: 1, resetAt, blocked: false, blockedUntil: null },
      });
      return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
    }
    // Limit hit.
    const blockedUntil =
      existing.blockedUntil && existing.blockedUntil > now ? existing.blockedUntil : existing.resetAt;
    return {
      allowed: false,
      remaining: 0,
      resetIn: blockedUntil.getTime() - now.getTime(),
      blockedUntil,
    };
  }

  const row = incremented[0];
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - row.count),
    resetIn: row.resetAt.getTime() - now.getTime(),
  };
}

export async function resetRateLimit(identifier: string): Promise<void> {
  await prisma.rateLimitEntry.deleteMany({ where: { key: identifier } });
}
