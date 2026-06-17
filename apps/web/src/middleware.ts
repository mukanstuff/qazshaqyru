import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/api-edge';

const PROTECTED_PATHS = ['/dashboard', '/invitations', '/settings', '/admin'];
const AUTH_PATHS = ['/login', '/verify'];

const locales = ['kz', 'ru'] as const;
type Locale = (typeof locales)[number];

function getLocaleFromPath(pathname: string): Locale | null {
  for (const loc of locales) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) return loc;
  }
  return null;
}

function isWellFormedSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const locale = getLocaleFromPath(pathname);
  if (locale) {
    const stripped = pathname.replace(`/${locale}`, '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = stripped;
    return NextResponse.redirect(url);
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthPath = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const hasValidFormat = sessionToken && isWellFormedSessionToken(sessionToken);

  if (isProtectedPath && !hasValidFormat) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && hasValidFormat) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  // Note: we deliberately do NOT echo any session-derived value back to the
  // client. Hashing a token per request costs CPU, and exposing even a hash
  // prefix gives an attacker an oracle to confirm guesses. Auth state can be
  // fetched by the client via /api/auth/session.

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads|.*\\..*).*)'],
};
