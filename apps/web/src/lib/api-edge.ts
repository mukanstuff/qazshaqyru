import { createHmac } from 'crypto';

/**
 * Edge-safe session secret resolution.
 *
 * The middleware runs in the Edge runtime and cannot access Node-only
 * Prisma. It only needs to compute a hash of the session cookie token so
 * that the server (which uses the same SESSION_SECRET) can look it up.
 *
 * Security model:
 * - In production, an unset or weak SESSION_SECRET is a hard error.
 *   We never fall back to a hard-coded string in prod.
 * - In development, a stable fallback allows onboarding without
 *   extra setup, but it is explicitly labelled and won't authenticate
 *   against a real production database.
 */
export const SESSION_COOKIE = 'session_token';

const DEV_FALLBACK_SECRET = 'edge-dev-fallback-not-for-production-use-32+';

export function getServerSecretForEdge(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[security] SESSION_SECRET must be set and at least 32 characters long in production. ' +
          'Generate one with: openssl rand -hex 32'
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

export function hashToken(token: string): string {
  return createHmac('sha256', getServerSecretForEdge()).update(token).digest('hex');
}
