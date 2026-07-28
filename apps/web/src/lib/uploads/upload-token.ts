/**
 * Upload tokens: HMAC-signed short-lived tokens that authorize
 * a single upload (either anonymous draft or invitation-scoped).
 *
 * Token format: `<expiresAt>.<type>.<invitationIdOrEmpty>.<hmac>`
 * - expiresAt: base36 epoch millis
 * - type: "draft" | "invitation"
 * - invitationIdOrEmpty: uuid or ""
 * - hmac: sha256(secret, body)
 */
import { createHmac, timingSafeEqual } from 'crypto';

export type UploadTokenScope =
  | { type: 'draft' }
  | { type: 'invitation'; invitationId: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const HMAC_ALG = 'sha256';

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) return 'dev-upload-secret-not-for-prod-please-set-it';
  return s;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function b64urlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

function sign(body: string): string {
  return createHmac(HMAC_ALG, getSecret()).update(body).digest('base64url');
}

export function createUploadToken(scope: UploadTokenScope): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const type = scope.type;
  const extra = scope.type === 'invitation' ? scope.invitationId : '';
  const body = `${expiresAt.toString(36)}.${type}.${extra}`;
  const hmac = sign(body);
  return { token: `${body}.${hmac}`, expiresAt };
}

export function verifyUploadToken(token: string, expected: UploadTokenScope): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [expStr, type, extra, hmac] = parts;
  if (type !== expected.type) return false;
  if (expected.type === 'invitation' && extra !== expected.invitationId) return false;
  if (expected.type === 'draft' && extra !== '') return false;
  const exp = parseInt(expStr, 36);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const body = `${expStr}.${type}.${extra}`;
  const expectedSig = sign(body);
  const a = Buffer.from(hmac);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
