import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildSitemapEntries, listSitemapLogicalPaths, renderSitemapXml } from '@/lib/seo/sitemap';
import { CATEGORY_ROUTES } from '@/lib/templates/template-categories';
import { SITEMAP_STATIC_PATHS } from '@/lib/site/footer-links';

describe('sitemap builder', () => {
  const prevAppUrl = process.env.APP_URL;

  beforeEach(() => {
    process.env.APP_URL = 'https://qazshaqyru.kz';
  });

  afterEach(() => {
    process.env.APP_URL = prevAppUrl;
  });

  it('includes category routes and excludes login', () => {
    const logical = listSitemapLogicalPaths();
    for (const cat of CATEGORY_ROUTES) {
      expect(logical).toContain(`/templates/${cat}`);
    }
    expect(logical).not.toContain('/login');
    expect(SITEMAP_STATIC_PATHS).not.toContain('/login');
  });

  it('does not emit individual template slug URLs', () => {
    const entries = buildSitemapEntries({ baseUrl: 'https://qazshaqyru.kz' });
    const locs = entries.map((e) => e.loc);
    // Categories OK
    expect(locs.some((l) => l.includes('/templates/wedding'))).toBe(true);
    // Fake template slug pattern should not appear as only category-like paths under templates
    const templatePaths = locs.filter((l) => /\/templates\/[^/]+$/.test(l.replace('https://qazshaqyru.kz', '').replace(/^\/(kk|ru)/, '')));
    for (const loc of templatePaths) {
      const slug = loc.split('/templates/')[1]?.split('/')[0];
      if (slug && !['kk', 'ru'].includes(slug)) {
        expect(CATEGORY_ROUTES as readonly string[]).toContain(slug);
      }
    }
  });

  it('includes locale mirrors for marketing pages', () => {
    const entries = buildSitemapEntries({ baseUrl: 'https://qazshaqyru.kz' });
    const locs = entries.map((e) => e.loc);
    expect(locs).toContain('https://qazshaqyru.kz/kk/uzatu');
    expect(locs).toContain('https://qazshaqyru.kz/ru/uzatu');
    expect(locs).toContain('https://qazshaqyru.kz/wedding');
    expect(locs).not.toContain('https://qazshaqyru.kz/compare/toi');
    expect(locs).toContain('https://qazshaqyru.kz/compare/done-for-you');
    expect(locs).toContain('https://qazshaqyru.kz/pricing');
  });

  it('renders valid xml urlset', () => {
    const xml = renderSitemapXml([
      { loc: 'https://qazshaqyru.kz/', changefreq: 'weekly', priority: 1 },
    ]);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('https://qazshaqyru.kz/');
  });
});
