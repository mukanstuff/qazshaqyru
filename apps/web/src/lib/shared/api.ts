import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/shared/db';
import { hashToken, verifyTokenHash, getClientIpFromHeaders } from '@/lib/auth';
import { verifyUploadToken, type UploadTokenScope } from '@/lib/uploads/upload-token';
import { checkRateLimit, type RateLimitConfig, RATE_LIMITS, type RateLimitResult } from '@/lib/shared/rate-limit';
import type { ZodType, ZodTypeDef } from 'zod';

export const SESSION_COOKIE = 'session_token';

export type SessionUser = {
  id: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
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
    // Log validation_error server-side so we don't have to ask the user to
    // inspect Network → Response when the client shape drifts (e.g. a new
    // wizard field hits a strict zod schema). Other 4xx codes (unauthorized,
    // forbidden, rate_limited, not_found) are expected operational noise —
    // don't spam logs with them.
    if (error.code === 'validation_error' && error.details) {
      console.error(`[${logPrefix}] validation_error:`, {
        message: error.message,
        details: error.details,
      });
    } else if (error.status >= 500) {
      console.error(`[${logPrefix}] ApiError ${error.status}:`, error.message, error.details);
    }
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status }
    );
  }

  console.error(`[${logPrefix}] Unhandled error:`, error);
  return NextResponse.json(
    { error: 'server_error', message: 'Внутренняя ошибка сервера' },
    { status: 500 }
  );
}

export async function getCurrentSession(): Promise<{
  session: { id: string; userId: string; expiresAt: Date; tokenHash: string };
  user: SessionUser;
} | null> {
  try {
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
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        tokenHash: session.tokenHash,
      },
      user: {
        id: session.user.id,
        phone: session.user.phone,
        email: session.user.email,
        avatarUrl: session.user.avatarUrl,
        language: session.user.language,
        name: session.user.name,
        isAdmin: session.user.isAdmin,
      },
    };
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<{
  session: { id: string; userId: string; expiresAt: Date; tokenHash: string };
  user: SessionUser;
}> {
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

/**
 * Upload endpoints may be accessed through a session, or through a scoped
 * short-lived upload token when the editor has not logged in yet.
 */
export async function requireUploadAccess(
  request: NextRequest,
  invitationId?: string | null
): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    if (invitationId) {
      const owned = await prisma.invitation.findFirst({
        where: { id: invitationId, userId: session.user.id },
        select: { id: true },
      });

      if (!owned) {
        throw new ApiError('forbidden', 'Нет доступа к этому приглашению', 403);
      }
    }
    return;
  }

  const token = request.headers.get('x-upload-token');
  if (!token) {
    throw new ApiError('unauthorized', 'Требуется авторизация или токен загрузки', 401);
  }

  const expectedScope: UploadTokenScope = invitationId
    ? { type: 'invitation', invitationId }
    : { type: 'draft' };

  if (!verifyUploadToken(token, expectedScope)) {
    throw new ApiError('unauthorized', 'Недействительный токен загрузки', 401);
  }
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
  return checkRateLimit(`${ip}:${identifier}`, config);
}

/** Rate limit by a global key (e.g. phone) without IP prefix — for OTP per-phone limits. */
/** Rate limit by a global key (e.g. phone) without IP prefix — for OTP per-phone limits. */
export async function applyGlobalRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(key, config);
}

export async function applyAuthReadRateLimit(
  request: NextRequest,
  userId: string
): Promise<RateLimitResult> {
  return applyRateLimit(request, `auth:read:${userId}`, RATE_LIMITS.API_AUTH_READ);
}

export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSeconds = Math.max(1, Math.ceil(result.resetIn / 1000));
  return NextResponse.json(
    {
      error: 'rate_limited',
      message: `Слишком много запросов. Попробуйте через ${retryAfterSeconds} секунд.`,
      retryAfter: retryAfterSeconds,
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export async function parseJsonBody<Output, Input = any>(request: NextRequest, schema: ZodType<Output, ZodTypeDef, Input>): Promise<Output> {
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
 * CSRF protection for state-changing requests.
 *
 * In production we require an exact same-origin match against APP_URL.
 * In development we allow requests to keep the local DX frictionless.
 */
export function checkSameOrigin(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error('[security] APP_URL is not set in production. Refusing to evaluate CSRF.');
  }

  let appHost: string;
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== 'https:') {
      throw new Error(`[security] APP_URL must use https://, got "${appUrl}"`);
    }
    appHost = parsed.host.toLowerCase();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[security]')) throw error;
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
