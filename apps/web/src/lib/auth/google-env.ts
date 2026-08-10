import 'server-only';

function readEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Google OAuth configuration. Returns null if env is not configured (e.g. local dev).
 * Caller should treat null as "Google login not available" and not crash.
 */
export function getGoogleOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} | null {
  const clientId = readEnv('GOOGLE_CLIENT_ID');
  const clientSecret = readEnv('GOOGLE_CLIENT_SECRET');
  const redirectUri = readEnv('GOOGLE_REDIRECT_URI');
  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthEnabled(): boolean {
  return getGoogleOAuthConfig() !== null;
}

/**
 * Public client id (safe to ship to the browser). Reads NEXT_PUBLIC_GOOGLE_CLIENT_ID,
 * falls back to GOOGLE_CLIENT_ID (acceptable for SPA-style flows, but prefer the
 * NEXT_PUBLIC variant to make intent explicit).
 */
export function getPublicGoogleClientId(): string | null {
  return readEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID') ?? readEnv('GOOGLE_CLIENT_ID');
}