import { normalizePhone, validatePhone } from '@/lib/auth';

/** Normalize Kaspi transfer phone to digits-only 11-char KZ format (77001234567). */
export function normalizeKaspiPhone(phone: string): string | null {
  const normalized = normalizePhone(phone.trim());
  if (!validatePhone(normalized)) return null;
  return normalized.replace(/\D/g, '');
}

/**
 * Build Kaspi transfer deep link for the public gift block.
 * Uses kaspi.kz pay-by-phone URL pattern.
 */
export function buildKaspiTransferUrl(phone: string): string | null {
  const normalized = normalizeKaspiPhone(phone);
  if (!normalized) return null;
  return `https://kaspi.kz/pay/phone?phone=${encodeURIComponent(normalized)}`;
}

/** Format phone for display: +7 (700) 123-45-67 */
export function formatKaspiPhoneDisplay(phone: string): string {
  const normalized = normalizeKaspiPhone(phone);
  if (!normalized || normalized.length !== 11) return phone.trim();
  return `+${normalized[0]} (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
}
