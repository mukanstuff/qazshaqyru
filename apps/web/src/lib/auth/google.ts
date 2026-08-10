import 'server-only';

/**
 * Google ID Token verification via native WebCrypto (no extra deps).
 * Google ID token is a JWT signed with RS256. We:
 *  1. Fetch JWKS from https://www.googleapis.com/oauth2/v3/certs (cached 1h).
 *  2. Find the JWK matching the token's `kid`.
 *  3. Verify signature with RS256 (WebCrypto).
 *  4. Verify standard claims: `iss`, `aud`, `exp`, `email_verified`.
 */

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUER = 'https://accounts.google.com';

type JwtHeader = { alg: string; kid: string; typ?: string };
type JwtPayload = {
  iss: string;
  azp?: string;
  aud: string | string[];
  sub: string;
  email: string;
  email_verified: boolean | string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  exp: number;
  iat: number;
};

type JwkKey = { kty: string; kid: string; alg?: string; use?: string; n: string; e: string };

type JwksCache = { fetchedAt: number; keys: JwkKey[] };
let jwksCache: JwksCache | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

function base64UrlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

function splitJwt(token: string): { header: JwtHeader; payload: JwtPayload; signingInput: Uint8Array; signature: Uint8Array } {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed Google ID token');
  const [h, p, s] = parts;
  const header = JSON.parse(bytesToString(base64UrlToBytes(h))) as JwtHeader;
  const payload = JSON.parse(bytesToString(base64UrlToBytes(p))) as JwtPayload;
  const signingInput = new TextEncoder().encode(`${h}.${p}`);
  const signature = base64UrlToBytes(s);
  return { header, payload, signingInput, signature };
}

async function fetchJwks(): Promise<JwkKey[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(JWKS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Google JWKS: ${res.status}`);
  }
  const data = (await res.json()) as { keys: JwkKey[] };
  jwksCache = { fetchedAt: Date.now(), keys: data.keys };
  return data.keys;
}

async function importRsaPublicKey(jwk: JwkKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', use: 'sig', kid: jwk.kid } as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  locale: string | null;
};

export type VerifyGoogleOptions = {
  /** Expected OAuth client id (audience). Throws if mismatch. */
  clientId: string;
  /** Dev-only escape hatch: skip signature check and just decode claims. NEVER use in prod. */
  skipSignature?: boolean;
};

export async function verifyGoogleIdToken(
  idToken: string,
  options: VerifyGoogleOptions,
): Promise<GoogleIdentity> {
  if (!idToken) throw new Error('Missing Google ID token');

  const { header, payload, signingInput, signature } = splitJwt(idToken);

  if (header.alg !== 'RS256') {
    throw new Error(`Unexpected JWT alg: ${header.alg}`);
  }

  if (!options.skipSignature) {
    const keys = await fetchJwks();
    const key = keys.find((k) => k.kid === header.kid);
    if (!key) {
      // Refresh once and retry — JWKS may have rotated.
      jwksCache = null;
      const fresh = await fetchJwks();
      const rotated = fresh.find((k) => k.kid === header.kid);
      if (!rotated) throw new Error('No matching JWK for token kid');
      const cryptoKey = await importRsaPublicKey(rotated);
      const ok = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
        signingInput.buffer.slice(signingInput.byteOffset, signingInput.byteOffset + signingInput.byteLength) as ArrayBuffer,
      );
      if (!ok) throw new Error('Invalid Google ID token signature');
    } else {
      const cryptoKey = await importRsaPublicKey(key);
      const ok = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer,
        signingInput.buffer.slice(signingInput.byteOffset, signingInput.byteOffset + signingInput.byteLength) as ArrayBuffer,
      );
      if (!ok) throw new Error('Invalid Google ID token signature');
    }
  }

  // Claims validation
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) {
    throw new Error('Google ID token expired');
  }
  if (payload.iss !== ISSUER) {
    throw new Error(`Unexpected issuer: ${payload.iss}`);
  }
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(options.clientId)) {
    throw new Error('Google ID token audience mismatch');
  }
  if (!payload.sub || !payload.email) {
    throw new Error('Google ID token missing sub/email');
  }
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!emailVerified) {
    throw new Error('Google email is not verified');
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: true,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
    locale: payload.locale ?? null,
  };
}

/**
 * Exchange a server-side OAuth `code` for Google's `id_token` + access_token.
 * Used by the redirect-flow callback. Returns null if exchange failed.
 */
export async function exchangeGoogleCode(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ idToken: string; accessToken: string } | null> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: 'authorization_code',
  });
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id_token?: string; access_token?: string };
    if (!data.id_token || !data.access_token) return null;
    return { idToken: data.id_token, accessToken: data.access_token };
  } catch {
    return null;
  }
}

export function getGoogleOAuthUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce?: string;
  /** Optional: request specific scopes. Defaults: openid email profile. */
  scopes?: string[];
}): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', args.clientId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', (args.scopes ?? ['openid', 'email', 'profile']).join(' '));
  url.searchParams.set('state', args.state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('include_granted_scopes', 'true');
  if (args.nonce) url.searchParams.set('nonce', args.nonce);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}