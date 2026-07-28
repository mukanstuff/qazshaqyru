/**
 * Media URL validation & parsing.
 *
 * User-supplied media (photos/music uploaded by invitation authors) may come from:
 *  - local /uploads/... paths (dev / self-hosted)
 *  - S3/R2 public CDN, when S3_PUBLIC_URL is configured
 *  - a curated allowlist of third-party sources (e.g. Pixabay music)
 *
 * Template media (bundled with the template at build time) may also come from
 * trusted hosts like Unsplash (template author assets, not user-controlled).
 */
import { isValidPublicObjectPath, parseS3Config } from './s3';

/** Curated Pixabay-hosted royalty-free music URLs available to all users. */
export const CURATED_MUSIC_URLS = new Set<string>([
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1718e32a6d.mp3',
]);

const ALLOWED_TEMPLATE_HOSTS = [
  'images.unsplash.com',
  'cdn.qazshaqyru.kz',
];

function isSafePath(url: string): boolean {
  try {
    // Reject protocol-relative URLs and backslashes; decode and check for traversal.
    if (url.includes('\\')) return false;
    const decoded = decodeURIComponent(url);
    if (decoded.includes('..')) return false;
    return true;
  } catch {
    return false;
  }
}

function isAllowedLocalOrCdn(url: string, subdir?: 'invitations' | 'music'): boolean {
  if (!url.startsWith('/')) return false;
  if (!isSafePath(url)) return false;
  if (url.startsWith('/assets/')) return true;
  if (!isValidPublicObjectPath(url)) return false;
  if (subdir && !url.startsWith(`/uploads/${subdir}/`) && !url.startsWith(`/${subdir}/`)) return false;
  return true;
}

function getConfiguredPublicHost(): string | null {
  const cfg = parseS3Config();
  if (!cfg || !cfg.publicUrl) return null;
  try {
    return new URL(cfg.publicUrl).origin;
  } catch {
    return null;
  }
}

export function isAllowedUserMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // 1. Local /uploads paths
  if (url.startsWith('/')) return isAllowedLocalOrCdn(url);

  // 2. S3/CDN public host
  const cdn = getConfiguredPublicHost();
  if (cdn) {
    try {
      const u = new URL(url);
      if (u.origin === cdn) {
        // path must look like /<subdir>/<file>
        if (/^\/(invitations|music)\/[^?#]+$/.test(u.pathname)) return true;
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Curated music allowlist (Pixabay CC0)
  if (url.startsWith('https://cdn.pixabay.com/')) return true;
  if (CURATED_MUSIC_URLS.has(url)) return true;

  return false;
}

export function parseUserMediaUrl(url: string): string {
  if (!isAllowedUserMediaUrl(url)) {
    throw new Error('disallowed_media_url');
  }
  return url;
}

export function isAllowedTemplateMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/')) return isAllowedLocalOrCdn(url);
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_TEMPLATE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export function parseTemplateMediaUrl(url: string): string {
  if (!isAllowedTemplateMediaUrl(url)) throw new Error('disallowed_template_media_url');
  return url;
}
