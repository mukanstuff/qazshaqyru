import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

const SESSION_TOKEN_LENGTH = 32;
const SESSION_EXPIRY_DAYS = 7;
const OTP_LENGTH = 6;
const SESSION_SECRET_MIN_LENGTH = 32;

export function getServerSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < SESSION_SECRET_MIN_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set and at least ${SESSION_SECRET_MIN_LENGTH} characters long. ` +
        'Generate one with: openssl rand -hex 32'
    );
  }
  return secret;
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_LENGTH).toString('hex');
}

export function hashToken(token: string): string {
  return createHmac('sha256', getServerSecret()).update(token).digest('hex');
}

/**
 * Guest tokens are returned to the client exactly once (when a guest row is
 * created) so they can be put into a personalized link. The server only
 * stores the HMAC of the token, so leaking URLs from server logs does not
 * give an attacker the ability to impersonate a guest.
 */
export function generateGuestToken(): { token: string; tokenHash: string } {
  // 32 bytes = 256 bits of entropy, URL-safe base64 (no padding).
  const raw = randomBytes(32).toString('base64url');
  return { token: raw, tokenHash: hashToken(raw) };
}

/**
 * Constant-time comparison of two hex strings. Use for any user-supplied
 * value being compared to a stored hash, to avoid timing oracles.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function verifyTokenHash(token: string, hash: string): boolean {
  const expected = hashToken(token);
  if (hash.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + SESSION_EXPIRY_DAYS);
  return expiry;
}

export function generateOTP(): string {
  const max = 10 ** OTP_LENGTH;
  const min = 10 ** (OTP_LENGTH - 1);
  const bytes = randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return ((value % (max - min)) + min).toString();
}

export function getOTPExpiry(minutes: number = 5): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  const visibleDigits = 2;
  const start = phone.slice(0, visibleDigits);
  const end = phone.slice(-visibleDigits);
  const masked = '*'.repeat(phone.length - visibleDigits * 2);
  return `${start}${masked}${end}`;
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = '+7' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') && cleaned.length === 11) {
    cleaned = '+' + cleaned;
  } else if (/^77\d{9}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function validatePhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  if (/^\+77\d{9}$/.test(cleaned)) return true;
  if (/^\+79\d{9}$/.test(cleaned)) return true;
  return false;
}

export function isKazakhPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return /^\+77\d{9}$/.test(cleaned);
}

export function formatPhoneForDisplay(phone: string): string {
  const cleaned = normalizePhone(phone);
  if (cleaned.startsWith('+77') && cleaned.length === 12) {
    return `+7 (${cleaned.slice(3, 6)}) ${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}-${cleaned.slice(11)}`;
  }
  if (cleaned.startsWith('+7') && cleaned.length === 12) {
    return `+7 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
  }
  return phone;
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
