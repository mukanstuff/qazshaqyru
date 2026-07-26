import type { Locale } from '@/i18n/shared';
import {
  type SeoPathLocale,
  internalToSeoPath,
  parseSeoPathLocale,
  stripSeoLocalePrefix,
} from '@/lib/seo/hreflang';

/**
 * Path prefixes that must NOT get `/kk`|`/ru` (guest invites, auth, app shell).
 * Marketing routes (home, pricing, event LP, templates, blog, compare, cities) DO get prefix.
 */
const NON_MARKETING_PREFIXES = [
  '/i/',
  '/login',
  '/verify',
  '/dashboard',
  '/invitations',
  '/settings',
  '/admin',
  '/mock-payment',
  '/api/',
] as const;

export function isMarketingHref(href: string): boolean {
  if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return false;
  }
  const pathOnly = href.split('?')[0]?.split('#')[0] || '/';
  if (pathOnly === '/i' || pathOnly.startsWith('/i/')) return false;
  return !NON_MARKETING_PREFIXES.some(
    (p) => pathOnly === p.replace(/\/$/, '') || pathOnly.startsWith(p.endsWith('/') ? p : `${p}/`) || pathOnly === p
  );
}

/** Normalize logical marketing path (no locale prefix). */
export function toLogicalPath(pathname: string): string {
  const stripped = stripSeoLocalePrefix(pathname.split('?')[0] || '/');
  return stripped || '/';
}

/**
 * Prefix a marketing href with SEO locale. Leaves guest/auth/app and absolute URLs alone.
 * Idempotent if href already has `/kk` or `/ru`.
 */
export function withSeoLocalePrefix(href: string, seoLocale: SeoPathLocale | null | undefined): string {
  if (!seoLocale || !isMarketingHref(href)) return href;

  const [pathPart, query = ''] = href.split('?');
  const hashIdx = pathPart.indexOf('#');
  const path = hashIdx >= 0 ? pathPart.slice(0, hashIdx) : pathPart;
  const hash = hashIdx >= 0 ? pathPart.slice(hashIdx) : '';

  if (parseSeoPathLocale(path)) {
    const logical = stripSeoLocalePrefix(path);
    const prefixed = logical === '/' ? `/${seoLocale}` : `/${seoLocale}${logical}`;
    return `${prefixed}${hash}${query ? `?${query}` : ''}`;
  }

  const normalized = !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  const prefixed = normalized === '/' ? `/${seoLocale}` : `/${seoLocale}${normalized}`;
  return `${prefixed}${hash}${query ? `?${query}` : ''}`;
}

/** Resolve SEO path locale from browser pathname, else from app locale (cookie UX). */
export function resolveSeoPathLocale(
  pathname: string | null | undefined,
  appLocale?: Locale | null
): SeoPathLocale | null {
  if (pathname) {
    const fromPath = parseSeoPathLocale(pathname);
    if (fromPath) return fromPath;
  }
  if (appLocale) return internalToSeoPath(appLocale);
  return null;
}

/** Swap or add `/kk`|`/ru` on current pathname when switching language. */
export function pathnameForSeoLocale(pathname: string, next: SeoPathLocale): string {
  const logical = toLogicalPath(pathname);
  return logical === '/' ? `/${next}` : `/${next}${logical}`;
}

/**
 * Soft Accept-Language hint (never hard-redirect). Prefer kk if Kazakh tags
 * appear before Russian; prefer ru if Russian appears first; else null.
 */
export function preferSeoLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined
): SeoPathLocale | null {
  if (!acceptLanguage?.trim()) return null;
  const parts = acceptLanguage
    .split(',')
    .map((p) => p.trim().split(';')[0]?.toLowerCase() ?? '')
    .filter(Boolean);
  for (const tag of parts) {
    if (tag === 'kk' || tag.startsWith('kk-') || tag === 'kaz') return 'kk';
    if (tag === 'ru' || tag.startsWith('ru-')) return 'ru';
  }
  return null;
}

/** Pure middleware-facing locale path decision (unit-testable). */
export type LocaleMiddlewareDecision =
  | { kind: 'redirect-legacy-kz'; toPathname: string }
  | { kind: 'rewrite'; stripPathname: string; seoLocale: SeoPathLocale; internalLocale: Locale }
  | { kind: 'passthrough' };

export function decideLocaleMiddleware(pathname: string): LocaleMiddlewareDecision {
  if (pathname === '/kz' || pathname.startsWith('/kz/')) {
    const rest = pathname.slice(3) || '';
    return { kind: 'redirect-legacy-kz', toPathname: `/kk${rest}` };
  }
  const seoLocale = parseSeoPathLocale(pathname);
  if (seoLocale) {
    return {
      kind: 'rewrite',
      stripPathname: stripSeoLocalePrefix(pathname),
      seoLocale,
      internalLocale: seoLocale === 'kk' ? 'kz' : 'ru',
    };
  }
  return { kind: 'passthrough' };
}
