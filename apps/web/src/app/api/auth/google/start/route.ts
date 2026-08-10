import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthConfig, isGoogleOAuthEnabled } from '@/lib/auth/google-env';
import { getGoogleOAuthUrl } from '@/lib/auth/google';
import { generateOAuthState, setOAuthStateCookie } from '@/lib/auth/oauth-state';
import { ApiError, apiErrorResponse } from '@/lib/shared/api';

/**
 * GET /api/auth/google/start?return_to=/dashboard
 *
 * Initiates the OAuth authorization-code redirect flow. Sets a CSRF state
 * cookie and 302-redirects the browser to Google.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isGoogleOAuthEnabled()) {
      throw new ApiError('oauth_disabled', 'Вход через Google недоступен', 503);
    }
    const cfg = getGoogleOAuthConfig();
    if (!cfg) throw new ApiError('oauth_disabled', 'Вход через Google недоступен', 503);

    const returnToRaw = request.nextUrl.searchParams.get('return_to') ?? '/dashboard';
    const returnTo = sanitizeReturnTo(returnToRaw);

    const state = generateOAuthState();
    await setOAuthStateCookie(state, returnTo);

    const url = getGoogleOAuthUrl({
      clientId: cfg.clientId,
      redirectUri: cfg.redirectUri,
      state,
    });

    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Google OAuth start');
  }
}

function sanitizeReturnTo(input: string): string {
  if (!input.startsWith('/')) return '/dashboard';
  if (input.startsWith('//')) return '/dashboard';
  return input.length > 200 ? '/dashboard' : input;
}