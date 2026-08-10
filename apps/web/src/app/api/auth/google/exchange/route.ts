import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyGoogleIdToken } from '@/lib/auth/google';
import { getGoogleOAuthConfig, isGoogleOAuthEnabled } from '@/lib/auth/google-env';
import { mergeIdentity, issueSession, buildSessionResponse } from '@/lib/auth/identity-merge';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';
import { getClientIpFromHeaders } from '@/lib/auth';

const schema = z.object({
  idToken: z.string().min(10),
});

/**
 * POST /api/auth/google/exchange
 * Body: { idToken: string }
 *
 * Used by client-side GIS (Google Identity Services) popup flow.
 * Verifies the Google id_token and issues a session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isGoogleOAuthEnabled()) {
      throw new ApiError('oauth_disabled', 'Вход через Google недоступен', 503);
    }
    const cfg = getGoogleOAuthConfig();
    if (!cfg) throw new ApiError('oauth_disabled', 'Вход через Google недоступен', 503);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_input', 'Не передан Google idToken', 400);
    }

    const ip = getClientIpFromHeaders(request.headers);
    const rl = await applyRateLimit(request, `google_exchange:${ip}`, RATE_LIMITS.GOOGLE_OAUTH_PER_IP);
    if (!rl.allowed) return rateLimitResponse(rl);

    const identity = await verifyGoogleIdToken(parsed.data.idToken, { clientId: cfg.clientId });

    const user = await mergeIdentity({
      provider: 'google',
      providerId: identity.sub,
      providerEmail: identity.email,
      displayName: identity.name,
      avatarUrl: identity.picture,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || null,
    });

    const session = await issueSession({
      userId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || null,
    });

    return buildSessionResponse(user, session.token, session.expiresAt);
  } catch (error) {
    return apiErrorResponse(error as Error, 'Google OAuth exchange');
  }
}