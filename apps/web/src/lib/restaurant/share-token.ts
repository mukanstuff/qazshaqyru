import { createHmac, randomBytes } from 'crypto';
import { getServerSecret, safeEqualStr } from '@/lib/auth';

const TOKEN_PREFIX = 'rest';

/** token = `${tokenHash}.${mac}` — lookup by hash, verify mac. */
export function createRestaurantShareToken(): { token: string; tokenHash: string } {
  const tokenHash = randomBytes(32).toString('hex');
  const mac = issueRestaurantShareMac(tokenHash);
  return {
    token: `${tokenHash}.${mac}`,
    tokenHash,
  };
}

export function issueRestaurantShareMac(tokenHash: string): string {
  return createHmac('sha256', getServerSecret())
    .update(`${TOKEN_PREFIX}:${tokenHash}`)
    .digest('base64url');
}

/** @deprecated alias — prefer issueRestaurantShareMac */
export function issueRestaurantShareToken(tokenHash: string): string {
  return issueRestaurantShareMac(tokenHash);
}

export function parseRestaurantShareToken(
  token: string
): { tokenHash: string; mac: string } | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const tokenHash = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^[a-f0-9]{64}$/i.test(tokenHash) || !mac) return null;
  return { tokenHash, mac };
}

export function verifyRestaurantShareToken(
  token: string,
  tokenHash: string | null | undefined
): boolean {
  if (!token || !tokenHash) return false;
  const parsed = parseRestaurantShareToken(token);
  if (!parsed) return false;
  if (parsed.tokenHash !== tokenHash) return false;
  return safeEqualStr(parsed.mac, issueRestaurantShareMac(tokenHash));
}

export function buildRestaurantPortalUrl(origin: string, token: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/r/${encodeURIComponent(token)}`;
}

export const RESTAURANT_SHARE_DEFAULT_TTL_DAYS = 90;

export function restaurantShareExpiresAt(
  from: Date = new Date(),
  ttlDays = RESTAURANT_SHARE_DEFAULT_TTL_DAYS
): Date {
  return new Date(from.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}

export function isRestaurantShareActive(params: {
  revokedAt: Date | null | undefined;
  expiresAt: Date | null | undefined;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  if (params.revokedAt) return false;
  if (params.expiresAt && params.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}
