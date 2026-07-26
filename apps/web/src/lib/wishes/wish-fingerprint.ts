import { createHash } from 'crypto';

/** Stable hash for wish-like deduplication (IP + user-agent). */
export function buildWishLikerHash(ip: string, userAgent: string | null): string {
  const payload = `${ip}|${userAgent ?? 'unknown'}`;
  return createHash('sha256').update(payload).digest('hex');
}
