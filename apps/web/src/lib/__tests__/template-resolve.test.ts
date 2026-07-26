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
  normalizeTemplateSlug,
  resolveTemplateBySlug,
  resolveTemplateIdBySlug,
} from '@/lib/templates/template-resolve';
import { ALL_TEMPLATE_SLUGS } from '@/lib/templates';
import { CATALOG_TEMPLATE_SLUGS } from '@/lib/templates/catalog';
import { quickWizardHref, DEFAULT_QUICK_TEMPLATE } from '@/lib/shared/quick-wizard-url';

beforeEach(() => {
  findFirst.mockReset();
});

describe('normalizeTemplateSlug', () => {
  it('maps legacy classic to wedding-luxury', () => {
    expect(normalizeTemplateSlug('classic')).toBe('wedding-luxury');
  });

  it('maps removed catalog slugs to wedding-luxury', () => {
    expect(normalizeTemplateSlug('wedding-rose-blush')).toBe('wedding-luxury');
    expect(normalizeTemplateSlug('starter-blank')).toBe('wedding-luxury');
  });

  it('passes through active slug unchanged', () => {
    expect(normalizeTemplateSlug('wedding-luxury')).toBe('wedding-luxury');
  });

  it('queries active template by normalized slug', async () => {
    findFirst.mockResolvedValueOnce({
      id: 'tpl-1',
      slug: 'wedding-luxury',
      priceKzt: 3990,
      nameRu: 'Свадебная роскошь',
    });

    const result = await resolveTemplateBySlug('classic');

    expect(findFirst).toHaveBeenCalledWith({
      where: { slug: 'wedding-luxury', isActive: true },
      select: { id: true, slug: true, priceKzt: true, nameRu: true },
    });
    expect(result?.id).toBe('tpl-1');
  });

  it('returns null id when template missing', async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(resolveTemplateIdBySlug('missing-template')).resolves.toBeNull();
  });
});

describe('template catalog', () => {
  it('sales catalog is wedding-luxury only; wiring-stub resolves via configs', () => {
    expect([...CATALOG_TEMPLATE_SLUGS]).toEqual(['wedding-luxury']);
    expect(ALL_TEMPLATE_SLUGS).toContain('wedding-luxury');
    expect(ALL_TEMPLATE_SLUGS).toContain('wiring-stub');
  });
});

describe('quickWizardHref', () => {
  it('builds live editor URL with default template', () => {
    expect(quickWizardHref()).toBe(`/invitations/edit?template=${encodeURIComponent(DEFAULT_QUICK_TEMPLATE)}`);
  });

  it('encodes template slug per card', () => {
    expect(quickWizardHref('wedding-luxury')).toBe('/invitations/edit?template=wedding-luxury');
  });
});
