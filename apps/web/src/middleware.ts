import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/api-edge';
import { sanitizeRedirectPath } from '@/lib/shared/redirect';
import { CATEGORY_ROUTES } from '@/lib/templates/template-categories';
import { LOCALE_HEADER, URL_LOCALE_HEADER } from '@/lib/seo/hreflang';
import { decideLocaleMiddleware } from '@/lib/seo/locale-path';
import { LOCALE_COOKIE } from '@/i18n/shared';
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  extractAttributionFromSearchParams,
  serializeAttribution,
} from '@/lib/shared/attribution';

/**
 * Stamps the first-touch attribution cookie onto `response` when the request
 * carries `?utm_source=...` and no attribution has been recorded yet this
 * visit. First-touch: never overwritten once set (see lib/shared/attribution.ts).
 */
function applyAttributionCookie(response: NextResponse, request: NextRequest) {
  if (request.cookies.get(ATTRIBUTION_COOKIE)) return;
  const data = extractAttributionFromSearchParams(request.nextUrl.searchParams);
  if (!data) return;
  response.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(data), {
    path: '/',
    maxAge: ATTRIBUTION_MAX_AGE_SECONDS,
    sameSite: 'lax',
  });
}

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

// Step 1.2: HTML-engine templates (hello-world, test-demo) were removed.
// Visiting /i/<slug> where slug is in this set returns 410 Gone.
const LEGACY_HTML_TEMPLATE_SLUGS = new Set<string>(['hello-world', 'test-demo']);

function legacyHtmlGoneResponse(): NextResponse {
  const body = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8" /><title>410 Gone</title></head>` +
    `<body style="font-family:system-ui;padding:48px;text-align:center;background:#fafafa;color:#111;">` +
    `<h1 style="margin:0 0 12px 0;font-size:24px;">410 — Шаблон больше недоступен</h1>` +
    `<p style="margin:0 0 20px 0;color:#555;">Этот HTML-шаблон был удалён (шаг 1.2). Выберите актуальный в каталоге.</p>` +
    `<a href="/templates" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">Открыть каталог</a>` +
    `</body></html>`;
  return new NextResponse(body, {
    status: 410,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

/**
 * `/templates/<slug>` where `<slug>` is not a real category.
 *
 * Locale prefixes are stripped first, so `/ru/templates/xyz` and
 * `/templates/xyz` are judged the same way. Deeper paths are left alone — this
 * only guards the single-segment category route the catalogue actually serves.
 */
function isUnknownCategoryPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(ru|kz|kk)(?=\/|$)/, '');
  const match = /^\/templates\/([^/]+)\/?$/.exec(stripped);
  if (!match) return false;
  return !(CATEGORY_ROUTES as readonly string[]).includes(decodeURIComponent(match[1]));
}

/**
 * A real 404 with a body someone can act on.
 *
 * Written inline for the same reason `legacyHtmlGoneResponse` above is: the
 * status has to be set in middleware, and middleware cannot render an app
 * route. Kept deliberately plain — it is a dead end, not a destination.
 */
function unknownCategoryResponse(): NextResponse {
  const body =
    `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<meta name="robots" content="noindex" />` +
    `<title>404 — такой категории нет</title></head>` +
    `<body style="font-family:system-ui;padding:48px 24px;text-align:center;background:#fffdf8;color:#2b2118;">` +
    `<p style="margin:0 0 8px 0;font-size:44px;color:#d8c9ae;">404</p>` +
    `<h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;">Такой категории у нас нет</h1>` +
    `<p style="margin:0 0 24px 0;color:#7a6a55;">Посмотрите, какие приглашения уже готовы.</p>` +
    `<a href="/templates" style="display:inline-block;padding:12px 24px;background:#7d1f2b;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;">Открыть каталог</a>` +
    `</body></html>`;
  return new NextResponse(body, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function isWellFormedSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/create' || pathname.startsWith('/create/')) return false;
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
        "img-src 'self' https://images.unsplash.com https://*.unsplash.com https://*.r2.cloudflarestorage.com https://*.s3.amazonaws.com https://*.b-cdn.net https://mc.yandex.ru data: blob:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://mc.yandex.ru`,
        "font-src 'self' https://fonts.gstatic.com",
        "media-src 'self' https://cdn.pixabay.com https://*.pixabay.com https://*.r2.cloudflarestorage.com https://*.s3.amazonaws.com https://*.b-cdn.net blob:",
        "connect-src 'self' https://api.twilio.com https://*.twilio.com https://*.kaspi.kz https://wa.me https://*.wa.me https://*.whatsapp.com https://mc.yandex.ru",
        isEmbedInvitationPreview ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
      ].join('; ')
    );
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Step 1.2: short-circuit /i/<legacy-html-slug> with a true HTTP 410
  // before any locale decision or page rendering kicks in.
  if (pathname.startsWith('/i/')) {
    const tail = pathname.slice('/i/'.length);
    const slug = tail.split('/')[0] ?? '';
    if (LEGACY_HTML_TEMPLATE_SLUGS.has(slug)) {
      return legacyHtmlGoneResponse();
    }
  }

  // Unknown catalogue category → a real 404, decided here rather than in the
  // page.
  //
  // The page already calls `notFound()`, but it never reaches the wire: the
  // route is `force-dynamic` and `/templates` has a `loading.tsx`, so Next
  // commits HTTP 200 with the streamed loading shell before the page body ever
  // runs. `/templates/anything-at-all` therefore answered 200 with a "Загрузка…"
  // document — a textbook soft 404, and an open invitation for a crawler to
  // index an unbounded number of junk URLs. Status has to be decided before
  // streaming starts, and middleware is the only layer that still can.
  //
  // Deliberately at this layer rather than via `dynamicParams = false`, because
  // that would force static params and fight `force-dynamic`, and because every
  // SEO route added later inherits the same streaming behaviour.
  if (isUnknownCategoryPath(pathname)) {
    return unknownCategoryResponse();
  }

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
    applyAttributionCookie(response, request);
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
  applyAttributionCookie(response, request);
  applySecurityHeaders(response, pathname, request);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads|.*\\..*).*)'],
};
