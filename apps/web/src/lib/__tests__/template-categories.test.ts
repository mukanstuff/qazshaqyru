import { describe, it, expect } from 'vitest';
import {
  CATEGORY_ROUTES,
  categoryRouteFromDb,
  resolveCategoryFromRoute,
} from '@/lib/templates/template-categories';

describe('template-categories', () => {
  it('resolves known route slugs to db categories', () => {
    expect(resolveCategoryFromRoute('wedding')).toBe('wedding');
    expect(resolveCategoryFromRoute('kyz-uzatu')).toBe('kyz_uzatu');
    expect(resolveCategoryFromRoute('sundet-toy')).toBe('sundet_toy');
    expect(resolveCategoryFromRoute('tusau-keser')).toBe('tusau_keser');
    expect(resolveCategoryFromRoute('unknown')).toBeNull();
  });

  it('maps db categories back to route slugs', () => {
    expect(categoryRouteFromDb('wedding')).toBe('wedding');
    expect(categoryRouteFromDb('kyz_uzatu')).toBe('kyz-uzatu');
    expect(categoryRouteFromDb('sundet_toy')).toBe('sundet-toy');
    expect(categoryRouteFromDb('tusau_keser')).toBe('tusau-keser');
    expect(categoryRouteFromDb('sundet')).toBeNull();
  });

  it('lists all public category routes', () => {
    expect(CATEGORY_ROUTES).toContain('wedding');
    expect(CATEGORY_ROUTES).toContain('kyz-uzatu');
    expect(CATEGORY_ROUTES).toContain('tusau-keser');
    expect(CATEGORY_ROUTES.length).toBeGreaterThanOrEqual(8);
  });
});
