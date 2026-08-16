import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock('@/lib/shared/db', () => ({
  default: {
    template: {
      findFirst,
    },
  },
}));

import {
  resolveTemplateBySlug,
  resolveTemplateIdBySlug,
} from '@/lib/templates/template-resolve';
import { ALL_TEMPLATE_SLUGS } from '@/lib/templates';
import { CATALOG_TEMPLATE_SLUGS } from '@/lib/templates/catalog';
import { quickWizardHref, DEFAULT_QUICK_TEMPLATE } from '@/lib/shared/quick-wizard-url';

beforeEach(() => {
  findFirst.mockReset();
});

describe('resolveTemplateBySlug', () => {
  it('queries the active template by exact slug', async () => {
    findFirst.mockResolvedValueOnce({
      id: 'tpl-1',
      slug: 'luxe-gold',
      priceKzt: 3990,
      nameRu: 'Свадебная роскошь',
    });

    const result = await resolveTemplateBySlug('luxe-gold');

    expect(findFirst).toHaveBeenCalledWith({
      where: { slug: 'luxe-gold', isActive: true },
      select: { id: true, slug: true, priceKzt: true, nameRu: true },
    });
    expect(result?.id).toBe('tpl-1');
  });

  it('returns null for unknown slug (no default-template fallback)', async () => {
    findFirst.mockResolvedValueOnce(null);

    const result = await resolveTemplateBySlug('classic');

    expect(findFirst).toHaveBeenCalledWith({
      where: { slug: 'classic', isActive: true },
      select: { id: true, slug: true, priceKzt: true, nameRu: true },
    });
    expect(result).toBeNull();
  });

  it('returns null id when template missing', async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(resolveTemplateIdBySlug('missing-template')).resolves.toBeNull();
  });
});

describe('template catalog', () => {
  it('sales catalog is luxe-gold only', () => {
    expect([...CATALOG_TEMPLATE_SLUGS]).toEqual(['luxe-gold']);
    expect(ALL_TEMPLATE_SLUGS).toContain('luxe-gold');
  });
});

describe('quickWizardHref', () => {
  it('builds quick wizard URL with default template', () => {
    expect(quickWizardHref()).toBe(`/create?template=${encodeURIComponent(DEFAULT_QUICK_TEMPLATE)}`);
  });

  it('encodes template slug per card', () => {
    expect(quickWizardHref('luxe-gold')).toBe('/create?template=luxe-gold');
  });
});
