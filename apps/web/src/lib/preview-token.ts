import { createHmac, randomBytes } from 'crypto';
import { getServerSecret, safeEqualStr } from '@/lib/auth';

/** Create a shareable family-preview token and its stored hash. */
export function createPreviewToken(): { token: string; tokenHash: string } {
  const tokenHash = randomBytes(32).toString('hex');
  return {
    token: issuePreviewToken(tokenHash),
    tokenHash,
  };
}

export function verifyPreviewToken(token: string, tokenHash: string | null | undefined): boolean {
  if (!token || !tokenHash) return false;
  return safeEqualStr(token, issuePreviewToken(tokenHash));
}

export function issuePreviewToken(tokenHash: string): string {
  return createHmac('sha256', getServerSecret()).update(`preview:${tokenHash}`).digest('base64url');
}

export function buildFamilyPreviewUrl(origin: string, slug: string, token: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/i/${encodeURIComponent(slug)}?preview=${encodeURIComponent(token)}`;
}
