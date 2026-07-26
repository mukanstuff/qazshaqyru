import { describe, it, expect } from 'vitest';
import { isValidMapUrl, parseMapUrl } from '@/lib/shared/map-url';

describe('map url validation', () => {
  it('accepts 2gis links', () => {
    expect(isValidMapUrl('https://2gis.kz/almaty/geo/70000001000000000')).toBe(true);
  });

  it('accepts google maps links', () => {
    expect(isValidMapUrl('https://maps.google.com/?q=Almaty')).toBe(true);
  });

  it('rejects arbitrary domains', () => {
    expect(isValidMapUrl('https://evil.example.com/map')).toBe(false);
  });

  it('parseMapUrl throws on invalid host', () => {
    expect(() => parseMapUrl('https://evil.example.com')).toThrow();
  });

  it('parseMapUrl returns null for empty', () => {
    expect(parseMapUrl('')).toBeNull();
    expect(parseMapUrl(null)).toBeNull();
  });
});
