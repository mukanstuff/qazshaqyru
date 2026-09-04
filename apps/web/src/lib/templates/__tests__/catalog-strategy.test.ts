import { describe, it, expect } from 'vitest';
import { COMING_SOON_TEMPLATES } from '@/lib/templates/coming-soon';
import { CATALOG_PRICE_DROP_THRESHOLD } from '@/lib/templates/catalog';

describe('template waitlist allowlist', () => {
  it('exposes coming-soon slugs for waitlist API', () => {
    expect(COMING_SOON_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    expect(COMING_SOON_TEMPLATES.every((t) => t.slug.length > 0)).toBe(true);
  });
});

describe('catalog price gate', () => {
  /**
   * `catalogLiveCount()` used to be the left-hand side of this comparison. It
   * counted entries in a hardcoded array that held exactly one phantom slug
   * (`luxe-gold`), so it answered 1 no matter how many templates were actually
   * live. The threshold is a product constant; the live count belongs to the
   * database, not to a constant file.
   */
  it('keeps the price-drop threshold a positive product constant', () => {
    expect(CATALOG_PRICE_DROP_THRESHOLD).toBeGreaterThan(0);
  });
});
