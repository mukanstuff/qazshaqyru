import { describe, it, expect } from 'vitest';
import {
  COMING_SOON_TEMPLATES,
  comingSoonByProduct,
  comingSoonForCategory,
} from '@/lib/templates/coming-soon';
import { getSuretManifest, listSuretManifests } from '@/lib/templates/suret-manifests';

describe('coming-soon catalog wiring', () => {
  it('includes sundet, tusau, and suret placeholders', () => {
    const slugs = COMING_SOON_TEMPLATES.map((t) => t.slug);
    expect(slugs).toContain('sundet-festive');
    expect(slugs).toContain('tusau-keser-soft');
    expect(slugs).toContain('suret-uzatu-01');
  });

  it('has enough Suret slots for designer pipeline (≥8)', () => {
    expect(comingSoonByProduct('suret').length).toBeGreaterThanOrEqual(8);
  });

  it('filters by category and product', () => {
    expect(comingSoonForCategory('sundet_toy').length).toBeGreaterThanOrEqual(1);
    expect(comingSoonByProduct('suret').every((t) => t.product === 'suret')).toBe(true);
  });
});

describe('suret manifests', () => {
  it('resolves pilot by id and slug', () => {
    expect(getSuretManifest('suret/uzatu-pilot-01')?.renderEngine).toBe('suret');
    expect(getSuretManifest('suret-uzatu-pilot-01')?.width).toBe(1080);
    expect(listSuretManifests().length).toBeGreaterThanOrEqual(1);
  });
});
