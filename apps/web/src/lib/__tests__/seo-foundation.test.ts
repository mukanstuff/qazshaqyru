import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildFaqPageSchema,
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
  buildHomeJsonLdGraph,
} from '@/lib/seo/json-ld';
import { buildLanguageAlternates, parseSeoPathLocale, stripSeoLocalePrefix } from '@/lib/seo/hreflang';
import {
  decideLocaleMiddleware,
  isMarketingHref,
  pathnameForSeoLocale,
  preferSeoLocaleFromAcceptLanguage,
  withSeoLocalePrefix,
} from '@/lib/seo/locale-path';
import { getSiteOrigin, SITE_ORIGIN_FALLBACK } from '@/lib/seo/site';
import { getSeoLanding } from '@/lib/seo/event-landings';
import { getCategorySeoCopy } from '@/lib/seo/category-copy';
import { CATEGORY_ROUTES } from '@/lib/templates/template-categories';

describe('seo site origin', () => {
  const prev = process.env.APP_URL;

  afterEach(() => {
    process.env.APP_URL = prev;
  });

  it('falls back to qazshaqyru.kz', () => {
    delete process.env.APP_URL;
    expect(getSiteOrigin()).toBe(SITE_ORIGIN_FALLBACK);
  });

  it('uses APP_URL when set', () => {
    process.env.APP_URL = 'https://qazshaqyru.kz/';
    expect(getSiteOrigin()).toBe('https://qazshaqyru.kz');
  });
});

describe('hreflang helpers', () => {
  beforeEach(() => {
    process.env.APP_URL = 'https://qazshaqyru.kz';
  });

  it('parses and strips seo locales', () => {
    expect(parseSeoPathLocale('/kk/uzatu')).toBe('kk');
    expect(parseSeoPathLocale('/ru/pricing')).toBe('ru');
    expect(stripSeoLocalePrefix('/kk/uzatu')).toBe('/uzatu');
    expect(stripSeoLocalePrefix('/ru')).toBe('/');
  });

  it('builds language alternates with self + x-default', () => {
    const alt = buildLanguageAlternates('/uzatu');
    expect(alt.languages?.['kk-KZ']).toContain('/kk/uzatu');
    expect(alt.languages?.['ru-KZ']).toContain('/ru/uzatu');
    expect(alt.languages?.['x-default']).toContain('/uzatu');
    expect(alt.canonical).toContain('/uzatu');
    expect(alt.canonical).not.toContain('/kk/');
  });

  it('self-canonical when current seo locale is kk', () => {
    const alt = buildLanguageAlternates('/uzatu', 'kk');
    expect(alt.canonical).toBe('https://qazshaqyru.kz/kk/uzatu');
    expect(alt.languages?.['kk-KZ']).toBe(alt.canonical);
    expect(alt.languages?.['ru-KZ']).toContain('/ru/uzatu');
    expect(alt.languages?.['x-default']).toContain('/uzatu');
  });
});

describe('locale path middleware + marketing links', () => {
  it('redirects legacy /kz to /kk', () => {
    expect(decideLocaleMiddleware('/kz/uzatu')).toEqual({
      kind: 'redirect-legacy-kz',
      toPathname: '/kk/uzatu',
    });
  });

  it('rewrites /kk and /ru with internal locale', () => {
    expect(decideLocaleMiddleware('/kk/pricing')).toEqual({
      kind: 'rewrite',
      stripPathname: '/pricing',
      seoLocale: 'kk',
      internalLocale: 'kz',
    });
    expect(decideLocaleMiddleware('/ru')).toEqual({
      kind: 'rewrite',
      stripPathname: '/',
      seoLocale: 'ru',
      internalLocale: 'ru',
    });
  });

  it('passthrough for unprefixed', () => {
    expect(decideLocaleMiddleware('/uzatu')).toEqual({ kind: 'passthrough' });
  });

  it('prefixes marketing hrefs and skips guest/auth', () => {
    expect(withSeoLocalePrefix('/pricing', 'kk')).toBe('/kk/pricing');
    expect(withSeoLocalePrefix('/templates?managed=1', 'ru')).toBe('/ru/templates?managed=1');
    expect(withSeoLocalePrefix('/i/abc', 'kk')).toBe('/i/abc');
    expect(withSeoLocalePrefix('/login', 'kk')).toBe('/login');
    expect(withSeoLocalePrefix('/invitations/edit', 'ru')).toBe('/invitations/edit');
    expect(withSeoLocalePrefix('/kk/uzatu', 'ru')).toBe('/ru/uzatu');
    expect(isMarketingHref('/dashboard')).toBe(false);
    expect(isMarketingHref('/blog')).toBe(true);
  });

  it('swaps pathname locale for language switcher', () => {
    expect(pathnameForSeoLocale('/kk/uzatu', 'ru')).toBe('/ru/uzatu');
    expect(pathnameForSeoLocale('/pricing', 'kk')).toBe('/kk/pricing');
  });
});

describe('json-ld builders', () => {
  beforeEach(() => {
    process.env.APP_URL = 'https://qazshaqyru.kz';
  });

  it('builds organization and website', () => {
    const org = buildOrganizationSchema();
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('QazShaqyru');

    const site = buildWebSiteSchema();
    expect(site['@type']).toBe('WebSite');
    expect(site.potentialAction).toBeTruthy();
  });

  it('builds faq and breadcrumb', () => {
    const faq = buildFaqPageSchema([{ question: 'Q?', answer: 'A.' }]);
    expect(faq['@type']).toBe('FAQPage');
    expect(faq.mainEntity).toHaveLength(1);

    const crumbs = buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Uzatu', path: '/uzatu' },
    ]);
    expect(crumbs.itemListElement).toHaveLength(2);
  });

  it('builds blog posting', () => {
    const post = buildBlogPostingSchema({
      title: 'Test',
      description: 'Desc',
      path: '/blog/test',
      datePublished: '2026-07-19',
    });
    expect(post['@type']).toBe('BlogPosting');
    expect(post.publisher).toBeTruthy();
  });

  it('home graph has three types without duplicate @context noise in graph items', () => {
    const graph = buildHomeJsonLdGraph();
    expect(graph['@graph']).toHaveLength(3);
  });
});

describe('event landings content', () => {
  const ALL_KEYS = [
    'uzatu',
    'sundet',
    'tusaukeser',
    'wedding',
    'betashar',
    'mereytoi',
    'almaty',
    'astana',
  ] as const;

  function bodyWordCount(key: (typeof ALL_KEYS)[number], locale: 'ru' | 'kz' = 'ru') {
    const L = getSeoLanding(key, locale);
    return [L.definition, ...L.sections.flatMap((s) => s.paragraphs)]
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length;
  }

  it('uzatu has substantial copy and faqs', () => {
    const L = getSeoLanding('uzatu');
    expect(bodyWordCount('uzatu')).toBeGreaterThanOrEqual(800);
    expect(L.faqs.length).toBeGreaterThanOrEqual(4);
    expect(L.primaryCta.href).toContain('/templates/');
  });

  it('all money/event landings meet ~800 word floor', () => {
    for (const key of ALL_KEYS) {
      expect(bodyWordCount(key), key).toBeGreaterThanOrEqual(800);
      const L = getSeoLanding(key);
      expect(L.faqs.length).toBeGreaterThanOrEqual(3);
      expect(L.sections.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('kk uzatu and sundet are unique vs ru', () => {
    const ruUzatu = getSeoLanding('uzatu', 'ru');
    const kkUzatu = getSeoLanding('uzatu', 'kz');
    expect(kkUzatu.h1).not.toBe(ruUzatu.h1);
    expect(kkUzatu.definition).not.toBe(ruUzatu.definition);
    expect(bodyWordCount('uzatu', 'kz')).toBeGreaterThanOrEqual(600);

    const ruSundet = getSeoLanding('sundet', 'ru');
    const kkSundet = getSeoLanding('sundet', 'kz');
    expect(kkSundet.h1).not.toBe(ruSundet.h1);
    expect(bodyWordCount('sundet', 'kz')).toBeGreaterThanOrEqual(500);
  });

  it('all 8 event landings have unique kk vs ru', () => {
    for (const key of ALL_KEYS) {
      const ru = getSeoLanding(key, 'ru');
      const kk = getSeoLanding(key, 'kz');
      expect(kk.h1, key).not.toBe(ru.h1);
      expect(kk.definition, key).not.toBe(ru.definition);
      expect(bodyWordCount(key, 'kz'), key).toBeGreaterThanOrEqual(500);
      expect(kk.faqs.length, key).toBeGreaterThanOrEqual(3);
      expect(kk.primaryCta.href, key).toMatch(/^\/(templates|pricing)/);
      expect(kk.secondaryCta.href, key).toMatch(/^\/(templates|pricing)/);
    }
  });

  it('preferSeoLocaleFromAcceptLanguage is soft-only helper', () => {
    expect(preferSeoLocaleFromAcceptLanguage('kk-KZ,kk;q=0.9,ru;q=0.8')).toBe('kk');
    expect(preferSeoLocaleFromAcceptLanguage('ru-RU,ru;q=0.9')).toBe('ru');
    expect(preferSeoLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBeNull();
    expect(preferSeoLocaleFromAcceptLanguage(null)).toBeNull();
  });

  it('new event pages exist', () => {
    for (const key of ['wedding', 'betashar', 'mereytoi', 'astana'] as const) {
      const L = getSeoLanding(key);
      expect(L.path.startsWith('/')).toBe(true);
      expect(L.sections.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('category seo copy thickness', () => {
  it('every category has intro + at least 2 faqs', () => {
    for (const route of CATEGORY_ROUTES) {
      const copy = getCategorySeoCopy(route);
      expect(copy.intro.length, route).toBeGreaterThanOrEqual(2);
      expect(copy.faqs.length, route).toBeGreaterThanOrEqual(2);
      const words = copy.intro.join(' ').split(/\s+/).filter(Boolean).length;
      expect(words, route).toBeGreaterThanOrEqual(40);
    }
  });

  it('money categories have unique kk intro vs ru', () => {
    const money = ['wedding', 'kyz-uzatu', 'sundet-toy', 'betashar', 'tusau-keser', 'anniversary'] as const;
    for (const route of money) {
      const ru = getCategorySeoCopy(route, 'ru');
      const kk = getCategorySeoCopy(route, 'kz');
      expect(kk.intro[0], route).not.toBe(ru.intro[0]);
      expect(kk.faqs.length, route).toBeGreaterThanOrEqual(2);
    }
  });
});
