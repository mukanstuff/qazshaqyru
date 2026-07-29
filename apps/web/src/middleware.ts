import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/api-edge';
import { sanitizeRedirectPath } from '@/lib/shared/redirect';
import { LOCALE_HEADER, URL_LOCALE_HEADER } from '@/lib/seo/hreflang';
import { decideLocaleMiddleware } from '@/lib/seo/locale-path';
import { LOCALE_COOKIE } from '@/i18n/shared';

function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

const PROTECTED_PATHS = ['/dashboard', '/invitations', '/settings', '/admin'];
const AUTH_PATHS = ['/login', '/verify'];

function isWellFormedSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/create' || pathname.startsWith('/create/')) return false;
  if (pathname === '/invitations/new') return false;
  if (pathname === '/invitations/quick' || pathname.startsWith('/invitations/quick/')) return false;
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function applySecurityHeaders(response: NextResponse, pathname: string, request: NextRequest) {
  const isEmbedInvitationPreview =
    pathname.startsWith('/i/') && request.nextUrl.searchParams.get('embed') === '1';

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', isEmbedInvitationPreview ? 'SAMEORIGIN' : 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    const nonce = createCspNonce();
    response.headers.set('x-nonce', nonce);
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "img-src 'self' https://images.unsplash.com https://*.unsplash.com https://*.r2.cloudflarestorage.com https://*.s3.amazonaws.com https://*.b-cdn.net data: blob:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "font-src 'self' https://fonts.gstatic.com",
        "media-src 'self' https://cdn.pixabay.com https://*.pixabay.com https://*.r2.cloudflarestorage.com https://*.s3.amazonaws.com https://*.b-cdn.net blob:",
        "connect-src 'self' https://api.twilio.com https://*.twilio.com https://*.kaspi.kz https://wa.me https://*.wa.me https://*.whatsapp.com",
        isEmbedInvitationPreview ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
      ].join('; ')
    );
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const localeDecision = decideLocaleMiddleware(pathname);
  if (localeDecision.kind === 'redirect-legacy-kz') {
    const url = request.nextUrl.clone();
    url.pathname = localeDecision.toPathname;
    return NextResponse.redirect(url, 308);
  }

  if (localeDecision.kind === 'rewrite') {
    const { stripPathname, seoLocale, internalLocale } = localeDecision;
    const url = request.nextUrl.clone();
    url.pathname = stripPathname;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, internalLocale);
    requestHeaders.set(URL_LOCALE_HEADER, seoLocale);

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_COOKIE, internalLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    applySecurityHeaders(response, stripPathname, request);
    return response;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const isProtected = isProtectedPath(pathname);
  const isAuthPath = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasValidFormat = Boolean(sessionToken && isWellFormedSessionToken(sessionToken));

  if (isProtected && !hasValidFormat) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', sanitizeRedirectPath(pathname, '/dashboard'));
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && hasValidFormat) {
    const redirectTo = request.nextUrl.searchParams.get('redirect');
    const destination = redirectTo ? sanitizeRedirectPath(redirectTo, '/dashboard') : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const response = NextResponse.next();
  applySecurityHeaders(response, pathname, request);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads|.*\\..*).*)'],
};
