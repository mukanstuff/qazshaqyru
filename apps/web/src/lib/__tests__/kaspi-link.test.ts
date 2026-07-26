import { describe, it, expect } from 'vitest';
import { buildKaspiTransferUrl, normalizeKaspiPhone, formatKaspiPhoneDisplay } from '@/lib/payments/kaspi-link';

describe('kaspi-link', () => {
  it('normalizes KZ phone', () => {
    expect(normalizeKaspiPhone('+7 (700) 123-45-67')).toBe('77001234567');
  });

  it('rejects invalid phone', () => {
    expect(normalizeKaspiPhone('123')).toBeNull();
  });

  it('builds kaspi transfer URL', () => {
    expect(buildKaspiTransferUrl('77001234567')).toBe(
      'https://kaspi.kz/pay/phone?phone=77001234567'
    );
  });

  it('formats phone for display', () => {
    expect(formatKaspiPhoneDisplay('77001234567')).toBe('+7 (700) 123-45-67');
  });
});
