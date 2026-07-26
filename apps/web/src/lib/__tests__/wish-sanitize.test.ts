import { describe, it, expect } from 'vitest';
import { sanitizeWishText, sanitizeWishAuthorName } from '@/lib/wishes/wish-sanitize';

describe('wish-sanitize', () => {
  it('strips HTML tags', () => {
    expect(sanitizeWishText('<b>Hello</b> world')).toBe('Hello world');
  });

  it('removes control characters', () => {
    expect(sanitizeWishText('Hi\u0000there')).toBe('Hithere');
  });

  it('normalizes whitespace', () => {
    expect(sanitizeWishText('  many   spaces  ')).toBe('many spaces');
  });

  it('truncates author name to 100 chars', () => {
    const long = 'a'.repeat(150);
    expect(sanitizeWishAuthorName(long).length).toBe(100);
  });
});
