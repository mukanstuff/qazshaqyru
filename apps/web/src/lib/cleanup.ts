/**
 * Periodic cleanup of transient database rows.
 *
 * Why: rate-limit counters, expired sessions, and used OTPs accumulate
 * forever and bloat the database. A short nightly pass keeps indexes
 * small and query plans stable.
 *
 * How to run: invoke `runDatabaseCleanup()` from a cron job, a server-
 * less scheduled function, or a "cleanup" admin button. The function is
 * idempotent and bounded by the size of the transient tables.
 */
import prisma from './db';

export interface CleanupResult {
  expiredSessions: number;
  expiredOtps: number;
  expiredRateLimits: number;
  revokedOldTokens: number;
  ranAt: string;
}

export async function runDatabaseCleanup(): Promise<CleanupResult> {
  const now = new Date();
  const [sessions, otps, rateLimits] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.oTPToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
    prisma.rateLimitEntry.deleteMany({ where: { resetAt: { lt: now } } }),
  ]);

  return {
    expiredSessions: sessions.count,
    expiredOtps: otps.count,
    expiredRateLimits: rateLimits.count,
    revokedOldTokens: 0,
    ranAt: now.toISOString(),
  };
}
