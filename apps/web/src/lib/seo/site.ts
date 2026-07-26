/** Canonical production origin (placeholder until domain is purchased). */
export const SITE_ORIGIN_FALLBACK = 'https://qazshaqyru.kz';

export const SITE_NAME = 'QazShaqyru';

export const SITE_LOGO_PATH = '/favicon.svg';

/** Absolute site origin without trailing slash. Always prefer APP_URL. */
export function getSiteOrigin(): string {
  const raw = process.env.APP_URL?.trim() || SITE_ORIGIN_FALLBACK;
  return raw.replace(/\/$/, '');
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteOrigin();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
