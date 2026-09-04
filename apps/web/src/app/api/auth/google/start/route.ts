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
    const returnToRaw = request.nextUrl.searchParams.get('return_to') ?? '/dashboard';
    const returnTo = sanitizeReturnTo(returnToRaw);

    // The browser navigates here directly (window.location.href), so an
    // ApiError response paints raw JSON in the address bar and strands the
    // user. /login already knows how to render `?google_error=oauth_disabled`
    // — send them back there instead.
    const cfg = isGoogleOAuthEnabled() ? getGoogleOAuthConfig() : null;
    if (!cfg) {
      const back = new URL('/login', request.nextUrl.origin);
      back.searchParams.set('google_error', 'oauth_disabled');
      back.searchParams.set('redirect', returnTo);
      return NextResponse.redirect(back, { status: 302 });
    }

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