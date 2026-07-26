import { createHash } from 'crypto';

/** Fingerprint for gift-transfer ack dedupe (same pattern as wish likes). */
export function buildGiftFingerprint(ip: string, userAgent: string | null): string {
  return createHash('sha256').update(`${ip}|${userAgent ?? 'unknown'}`).digest('hex');
}

export function sanitizeGiftAuthorName(raw: string): string {
  return raw.trim().slice(0, 100);
}

export function sanitizeGiftNote(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, 300);
  return trimmed.length > 0 ? trimmed : null;
}
