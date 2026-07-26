/**
 * Validates post-login redirect paths to prevent open-redirect attacks.
 * Only same-origin relative paths are allowed.
 */
export function isValidRedirectPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  if (path.includes('\\')) return false;
  return true;
}

export function sanitizeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  return isValidRedirectPath(path) ? path : fallback;
}
