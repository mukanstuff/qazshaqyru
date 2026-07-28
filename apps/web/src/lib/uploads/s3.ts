/**
 * S3 / R2 path validation helpers. These are pure functions
 * that do not touch the network, so they can run on the client too.
 */

export const ALLOWED_UPLOAD_SUBDIRS = ['invitations', 'music'] as const;
export type UploadSubdir = (typeof ALLOWED_UPLOAD_SUBDIRS)[number];

export function isValidUploadSubdir(dir: string): dir is UploadSubdir {
  return (ALLOWED_UPLOAD_SUBDIRS as readonly string[]).includes(dir);
}

const SAFE_FILENAME_RE = /^[A-Za-z0-9._-]+$/;

export function assertSafeUploadFilename(filename: string): void {
  if (!filename || typeof filename !== 'string') throw new Error('invalid_filename');
  if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    throw new Error('invalid_filename');
  }
  if (filename === '.' || filename === '..') throw new Error('invalid_filename');
  if (!SAFE_FILENAME_RE.test(filename)) throw new Error('invalid_filename');
}

export function buildS3ObjectKey(subdir: string, filename: string): string {
  if (!isValidUploadSubdir(subdir)) throw new Error('invalid_subdir');
  assertSafeUploadFilename(filename);
  return `${subdir}/${filename}`;
}

const PUBLIC_PATH_RE = /^\/(?:uploads\/)?(invitations|music)\/([^?#]+)$/;

export interface ParsedPublicPath {
  subdir: UploadSubdir;
  key: string;
  filename: string;
}

export function isValidPublicObjectPath(path: string): boolean {
  return parsePublicObjectPath(path) !== null;
}

export function parsePublicObjectPath(path: string): ParsedPublicPath | null {
  const m = path.match(PUBLIC_PATH_RE);
  if (!m) return null;
  const subdir = m[1] as UploadSubdir;
  const key = m[2];
  const parts = key.split('/');
  const filename = parts[parts.length - 1];
  if (!filename || parts.some((p) => p === '..' || p === '.' || !p)) return null;
  if (!isValidUploadSubdir(subdir)) return null;
  try {
    assertSafeUploadFilename(filename);
  } catch {
    return null;
  }
  return { subdir, key, filename };
}

export interface S3ConfigInput {
  S3_ENDPOINT?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY?: string;
  S3_SECRET_KEY?: string;
  S3_REGION?: string;
  S3_PUBLIC_URL?: string;
}

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  publicUrl: string;
}

const REQUIRED = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'] as const;

export function getS3MissingConfigKeys(env: Partial<Record<string, string | undefined>> = process.env): string[] {
  const missing: string[] = [];
  for (const k of REQUIRED) {
    if (!env[k] || typeof env[k] !== 'string' || env[k]!.trim().length === 0) {
      missing.push(k);
    }
  }
  return missing;
}

export function parseS3Config(env: Partial<Record<string, string | undefined>> = process.env): S3Config | null {
  const missing = getS3MissingConfigKeys(env);
  if (missing.length > 0) return null;
  const publicUrl = (env.S3_PUBLIC_URL || '').replace(/\/+$/, '');
  return {
    endpoint: env.S3_ENDPOINT!.replace(/\/+$/, ''),
    bucket: env.S3_BUCKET!.trim(),
    accessKey: env.S3_ACCESS_KEY!.trim(),
    secretKey: env.S3_SECRET_KEY!.trim(),
    region: (env.S3_REGION || 'auto').trim(),
    publicUrl: publicUrl || '',
  };
}

/**
 * Returns a warning message if public CDN URL is misconfigured
 * (e.g. leaks R2 API endpoint), or null if OK.
 */
export function validateS3UrlSeparation(env: Partial<Record<string, string | undefined>>): string | null {
  const endpoint = (env.S3_ENDPOINT || '').replace(/\/+$/, '');
  const publicUrl = (env.S3_PUBLIC_URL || '').replace(/\/+$/, '');
  if (!endpoint || !publicUrl) return null;
  if (publicUrl === endpoint) {
    return 'S3_PUBLIC_URL must differ from S3_ENDPOINT (use a public CDN/bucket domain, not the API host)';
  }
  if (publicUrl.includes('cloudflarestorage.com')) {
    return 'S3_PUBLIC_URL must not point at the R2 API host (*.r2.cloudflarestorage.com) — use a public r2.dev/custom domain';
  }
  return null;
}
