import { describe, it, expect, beforeAll } from 'vitest';
import { normalizePhone, validatePhone, isKazakhPhone, safeEqualStr } from '@/lib/auth';

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-at-least-32-characters-long';
});

describe('normalizePhone', () => {
  it('normalizes 8-prefix Kazakhstan numbers', () => {
    expect(normalizePhone('87001234567')).toBe('+77001234567');
  });

  it('keeps +77 format', () => {
    expect(normalizePhone('+77001234567')).toBe('+77001234567');
  });
});

describe('validatePhone', () => {
  it('accepts valid KZ mobile', () => {
    expect(validatePhone('+77001234567')).toBe(true);
  });

  it('rejects too short numbers', () => {
    expect(validatePhone('123')).toBe(false);
  });
});

describe('isKazakhPhone', () => {
  it('detects +77 numbers', () => {
    expect(isKazakhPhone('+77001234567')).toBe(true);
  });
});

describe('safeEqualStr', () => {
  it('compares equal strings in constant time path', () => {
    expect(safeEqualStr('abc', 'abc')).toBe(true);
    expect(safeEqualStr('abc', 'abd')).toBe(false);
  });
});
