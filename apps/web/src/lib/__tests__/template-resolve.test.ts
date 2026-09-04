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
      select: { id: true, slug: true, priceKzt: true, nameRu: true, canvas: true, isCanvasTemplate: true },
    });
    expect(result?.id).toBe('tpl-1');
  });

  it('returns null for unknown slug (no default-template fallback)', async () => {
    findFirst.mockResolvedValueOnce(null);

    const result = await resolveTemplateBySlug('classic');

    expect(findFirst).toHaveBeenCalledWith({
      where: { slug: 'classic', isActive: true },
      select: { id: true, slug: true, priceKzt: true, nameRu: true, canvas: true, isCanvasTemplate: true },
    });
    expect(result).toBeNull();
  });

  it('returns null id when template missing', async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(resolveTemplateIdBySlug('missing-template')).resolves.toBeNull();
  });
});

/**
 * Two describe blocks were removed here. One asserted that the sales catalog is
 * "luxe-gold only" — a slug that has never existed in the Template table, while
 * the live catalog is aq-bata / dala / elegant-gold-wedding-01. The other
 * asserted quickWizardHref() returns `/create?template=…`, which stopped being
 * true when the builder switched to `/preview/…`; both were failing and both
 * described a product that does not exist. URL-builder coverage now lives in
 * lib/__tests__/quick-wizard-url.test.ts.
 */
