import { describe, it, expect } from 'vitest';
import { COMING_SOON_TEMPLATES } from '@/lib/templates/coming-soon';
import { catalogLiveCount, CATALOG_PRICE_DROP_THRESHOLD } from '@/lib/templates/catalog';

describe('template waitlist allowlist', () => {
  it('exposes coming-soon slugs for waitlist API', () => {
    expect(COMING_SOON_TEMPLATES.length).toBeGreaterThanOrEqual(12);
    expect(COMING_SOON_TEMPLATES.every((t) => t.slug.length > 0)).toBe(true);
  });
});

describe('catalog price gate', () => {
  it('keeps Standard at 3990 until catalog threshold', () => {
    expect(catalogLiveCount()).toBeLessThan(CATALOG_PRICE_DROP_THRESHOLD);
  });
});
