import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from './db';
import { hashToken, verifyTokenHash, getClientIpFromHeaders } from './auth';
import { checkRateLimit, RateLimitConfig, RATE_LIMITS, RateLimitResult } from './rate-limit';
import { ZodError, ZodSchema } from 'zod';

export const SESSION_COOKIE = 'session_token';

export type SessionUser = {
  id: string;
  phone: string;
  language: 'kz' | 'ru';
  name: string | null;
  isAdmin: boolean;
};

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
  }
}

export function apiErrorResponse(error: ApiError | Error, logPrefix = 'API') {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      { status: error.status }
    );
  }
  console.error(`[${logPrefix}] Unhandled error:`, error);
  return NextResponse.json({ error: 'server_error', message: 'Внутренняя ошибка сервера' }, { status: 500 });
}

export async function getCurrentSession(): Promise<{ session: { id: string; userId: string; expiresAt: Date; tokenHash: string }; user: SessionUser } | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    session: { id: session.id, userId: session.userId, expiresAt: session.expiresAt, tokenHash: session.tokenHash },
    user: {
      id: session.user.id,
      phone: session.user.phone,
      language: session.user.language,
      name: session.user.name,
      isAdmin: session.user.isAdmin,
    },
  };
}

export async function requireAuth(): Promise<{ session: { id: string; userId: string; expiresAt: Date; tokenHash: string }; user: SessionUser }> {
  const ctx = await getCurrentSession();
  if (!ctx) {
    throw new ApiError('unauthorized', 'Требуется авторизация', 401);
  }
  return ctx;
}

export async function requireAdmin(): Promise<{ user: SessionUser }> {
  const ctx = await requireAuth();
  if (!ctx.user.isAdmin) {
    throw new ApiError('forbidden', 'Недостаточно прав', 403);
  }
  return { user: ctx.user };
}

export function getClientIp(request: NextRequest): string {
  return getClientIpFromHeaders(request.headers);
}

export async function applyRateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const key = `${ip}:${identifier}`;
  return checkRateLimit(key, config);
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: 'rate_limited',
      message: `Слишком много запросов. Попробуйте через ${Math.ceil(result.resetIn / 1000)} секунд.`,
      retryAfter: Math.ceil(result.resetIn / 1000),
    },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(result.resetIn / 1000)) } }
  );
}

export async function parseJsonBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError('invalid_json', 'Некорректный JSON', 400);
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError('validation_error', 'Ошибка валидации', 400, result.error.flatten());
  }
  return result.data;
}

/**
 * CSRF: state-changing requests must come from the same origin as APP_URL.
 *
 * Security model:
 * - In production, an unset APP_URL is a fatal error (fail-secure). We never
 *   silently downgrade to "allow everything" in prod.
 * - In development, we permit all origins to keep DX smooth.
 * - The comparison normalizes both hosts and only allows exact host match
 *   (no `www.` aliases, no port mixing).
 */
export function checkSameOrigin(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    // Fail-secure: never silently bypass CSRF in production.
    // Surface this loudly so the operator fixes the env immediately.
    throw new Error(
      '[security] APP_URL is not set in production. Refusing to evaluate CSRF.'
    );
  }

  let appHost: string;
  try {
    appHost = new URL(appUrl).host.toLowerCase();
  } catch {
    throw new Error(`[security] APP_URL is not a valid URL: "${appUrl}"`);
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === appHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === appHost;
    } catch {
      return false;
    }
  }

  // No Origin/Referer: for a same-origin navigation this should not happen
  // (browsers always send one for state-changing requests). For safety, deny.
  return false;
}

export { RATE_LIMITS };
export { verifyTokenHash };

export function setSessionCookie(response: NextResponse, token: string, expires: Date): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}
