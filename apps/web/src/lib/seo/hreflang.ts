import type { Metadata } from 'next';
import type { Locale } from '@/i18n/shared';
import { absoluteUrl } from '@/lib/seo/site';

/** URL path prefixes for SEO (ISO 639-1: kk, not internal `kz`). */
export const SEO_PATH_LOCALES = ['kk', 'ru'] as const;
export type SeoPathLocale = (typeof SEO_PATH_LOCALES)[number];

export const LOCALE_HEADER = 'x-pathname-locale';
export const URL_LOCALE_HEADER = 'x-url-locale';

/** Map SEO path locale → internal app locale. */
export function seoPathToInternal(seo: SeoPathLocale): Locale {
  return seo === 'kk' ? 'kz' : 'ru';
}

export function internalToSeoPath(locale: Locale): SeoPathLocale {
  return locale === 'kz' ? 'kk' : 'ru';
}

export function parseSeoPathLocale(pathname: string): SeoPathLocale | null {
  for (const loc of SEO_PATH_LOCALES) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) return loc;
  }
  return null;
}

/** Strip `/kk` or `/ru` prefix. Legacy `/kz` also stripped. */
export function stripSeoLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(kk|ru|kz)(\/.*)?$/);
  if (!match) return pathname;
  return match[2] || '/';
}

function trimUrl(url: string): string {
  const trimmed = url.replace(/\/$/, '');
  return trimmed || getSiteOriginFallback();
}

function getSiteOriginFallback(): string {
  return absoluteUrl('/').replace(/\/$/, '') || 'https://qazshaqyru.kz';
}

/**
 * Build Next.js `alternates.languages` for a logical path (no locale prefix).
 * Example path: `/uzatu` → kk + ru + x-default.
 *
 * Pass `currentSeoLocale` when the request is on `/kk/…` or `/ru/…` so canonical
 * is self-referencing (required for valid hreflang + canonical alignment).
 */
export function buildLanguageAlternates(
  logicalPath: string,
  currentSeoLocale?: SeoPathLocale | null
): NonNullable<Metadata['alternates']> {
  const normalized =
    !logicalPath || logicalPath === '/'
      ? ''
      : logicalPath.startsWith('/')
        ? logicalPath
        : `/${logicalPath}`;

  const kk = trimUrl(absoluteUrl(`/kk${normalized || ''}`)) || absoluteUrl('/kk');
  const ru = trimUrl(absoluteUrl(`/ru${normalized || ''}`)) || absoluteUrl('/ru');
  const xDefault = trimUrl(absoluteUrl(normalized || '/')) || absoluteUrl('/');

  const canonical =
    currentSeoLocale === 'kk' ? kk : currentSeoLocale === 'ru' ? ru : xDefault;

  return {
    canonical,
    languages: {
      'kk-KZ': kk,
      'ru-KZ': ru,
      'x-default': xDefault,
    },
  };
}

/** Read SEO path locale from middleware rewrite headers (server only). */
export function seoLocaleFromHeaders(headerGet: (name: string) => string | null): SeoPathLocale | null {
  const raw = headerGet(URL_LOCALE_HEADER);
  if (raw === 'kk' || raw === 'ru') return raw;
  return null;
}
