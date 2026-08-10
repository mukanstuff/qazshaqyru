import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeGoogleCode,
  verifyGoogleIdToken,
} from '@/lib/auth/google';
import { getGoogleOAuthConfig, isGoogleOAuthEnabled } from '@/lib/auth/google-env';
import { readAndClearOAuthState } from '@/lib/auth/oauth-state';
import { mergeIdentity, issueSession } from '@/lib/auth/identity-merge';
import { ApiError, apiErrorResponse } from '@/lib/shared/api';
import { getClientIpFromHeaders } from '@/lib/auth';

/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * Google redirects the browser here after consent. We:
 *  1. Verify CSRF state (cookie must match `state` query param).
 *  2. Exchange `code` for an `id_token` via Google's token endpoint.
 *  3. Verify the `id_token` signature/claims.
 *  4. Merge identity and issue a session cookie.
 *  5. Redirect to the original `return_to` path (default `/dashboard`).
 */
export async function GET(request: NextRequest) {
  try {
    if (!isGoogleOAuthEnabled()) {
      throw new ApiError('oauth_disabled', 'Вход через Google недоступен', 503);
    }
    const cfg = getGoogleOAuthConfig();
    if (!cfg) throw new ApiError('oauth_disabled', 'Вход через Google недоступен', 503);

    const url = request.nextUrl;
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');

    if (oauthError) {
      return NextResponse.redirect(new URL('/login?google_error=' + encodeURIComponent(oauthError), request.url), { status: 302 });
    }
    if (!code || !state) {
      throw new ApiError('invalid_callback', 'Неполные параметры от Google', 400);
    }

    const stateInfo = await readAndClearOAuthState(state);
    if (!stateInfo) {
      throw new ApiError('invalid_state', 'Неверный или просроченный state. Попробуйте снова.', 400);
    }

    const exchanged = await exchangeGoogleCode({
      code,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      redirectUri: cfg.redirectUri,
    });
    if (!exchanged) {
      throw new ApiError('exchange_failed', 'Не удалось обменять код у Google', 502);
    }

    const identity = await verifyGoogleIdToken(exchanged.idToken, { clientId: cfg.clientId });

    const ip = getClientIpFromHeaders(request.headers);
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

    const target = sanitizeReturnTo(stateInfo.returnTo ?? '/dashboard');
    const response = NextResponse.redirect(new URL(target, request.url), { status: 302 });
    // We can't import setSessionCookie directly here because it expects NextResponse.json,
    // but the underlying response.cookies API works the same. Set via the same module.
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    return apiErrorResponse(error as Error, 'Google OAuth callback');
  }
}

function sanitizeReturnTo(input: string): string {
  if (!input.startsWith('/')) return '/dashboard';
  if (input.startsWith('//')) return '/dashboard';
  return input.length > 200 ? '/dashboard' : input;
}