import { describe, it, expect } from 'vitest';
import { buildWishLikerHash } from '@/lib/wishes/wish-fingerprint';

describe('wish-fingerprint', () => {
  it('produces stable hash for same inputs', () => {
    const a = buildWishLikerHash('1.2.3.4', 'Mozilla/5.0');
    const b = buildWishLikerHash('1.2.3.4', 'Mozilla/5.0');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('differs for different IPs', () => {
    const a = buildWishLikerHash('1.2.3.4', 'Mozilla/5.0');
    const b = buildWishLikerHash('5.6.7.8', 'Mozilla/5.0');
    expect(a).not.toBe(b);
  });
});
