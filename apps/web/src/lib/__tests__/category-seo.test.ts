import { describe, it, expect } from 'vitest';
import { getCategoryPageMetadata, isValidCategoryRoute } from '@/lib/templates/category-seo';
import { ru } from '@/i18n/messages/ru';
import { kz } from '@/i18n/messages/kz';

describe('category-seo', () => {
  it('validates category routes', () => {
    expect(isValidCategoryRoute('wedding')).toBe(true);
    expect(isValidCategoryRoute('sundet-toy')).toBe(true);
    expect(isValidCategoryRoute('invalid')).toBe(false);
  });

  it('returns localized metadata for wedding', () => {
    const metaRu = getCategoryPageMetadata('ru', 'wedding', { ru, kz });
    expect(metaRu.title).toContain('Свадебные');
    expect(metaRu.description.length).toBeGreaterThan(10);

    const metaKz = getCategoryPageMetadata('kz', 'wedding', { ru, kz });
    expect(metaKz.title).toContain('Үйлену');
  });

  it('returns sundet-toy metadata', () => {
    const meta = getCategoryPageMetadata('ru', 'sundet-toy', { ru, kz });
    expect(meta.title.toLowerCase()).toContain('сундет');
    expect(meta.description).toBeTruthy();
  });

  it('falls back to title when metaTitle missing', () => {
    const sparse = { ru: { categoryPage: { toy: { title: 'Toy Title' } } }, kz: {} };
    const meta = getCategoryPageMetadata('ru', 'toy', sparse);
    expect(meta.title).toBe('Toy Title');
  });
});
