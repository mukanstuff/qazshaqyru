import { listBlogPosts } from '@/lib/blog/posts';
import { CATEGORY_ROUTES } from '@/lib/templates/template-categories';
import { SITEMAP_STATIC_PATHS } from '@/lib/site/footer-links';
import { CITY_SLUGS } from '@/lib/seo/cities';
import { CITY_EVENTS } from '@/lib/seo/city-event';
import { getSiteOrigin } from '@/lib/seo/site';
import { SEO_PATH_LOCALES } from '@/lib/seo/hreflang';

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
};

function priorityForPath(path: string): number {
  if (path === '' || path === '/') return 1.0;
  if (path === '/templates' || path === '/blog' || path === '/pricing') return 0.9;
  if (path.startsWith('/templates/')) return 0.85;
  if (path.startsWith('/blog/')) return 0.55;
  return 0.65;
}

function changefreqForPath(path: string): SitemapUrlEntry['changefreq'] {
  if (path === '' || path === '/' || path === '/blog' || path === '/templates') return 'weekly';
  return 'monthly';
}

/**
 * Logical paths that should appear in the sitemap (no locale prefix, no auth).
 *
 * `liveCategories` is the set of catalogue routes that actually hold templates.
 * Omit it and every category is listed, which is what shipped: the sitemap
 * invited crawlers to all nine categories while eight were empty and carried
 * `noindex`. Telling a crawler "come here" in the sitemap and "do not index
 * this" in the markup is a contradiction that spends crawl budget on nothing.
 * Passing the live set keeps the two signals agreeing, and a category re-enters
 * the sitemap by itself the moment it has something to show.
 */
export function listSitemapLogicalPaths(liveCategories?: readonly string[]): string[] {
  const routes = liveCategories ?? CATEGORY_ROUTES;
  const categories = routes.map((c) => `/templates/${c}`);
  const staticPaths = SITEMAP_STATIC_PATHS.map((p) => (p === '' ? '/' : p));

  /*
   * City pages, but only for events whose category has stock.
   *
   * The full grid is 12 cities × 6 events = 72 pages, and every one of them
   * renders fine. Advertising all 72 while five of the six categories are empty
   * would be publishing a doorway set: dozens of near-identical pages that
   * cannot answer the query they rank for. Gating on inventory lets the grid
   * grow with the catalogue, with no list to maintain by hand.
   */
  const liveSet = new Set(routes);
  const cityPaths = CITY_EVENTS.filter((e) => liveSet.has(e.category)).flatMap((e) =>
    CITY_SLUGS.map((city) => `/${e.event}/${city}`),
  );

  return Array.from(new Set([...staticPaths, ...categories, ...cityPaths]));
}

/**
 * Build sitemap entries.
 * Includes unprefixed URLs (x-default) and `/kk` + `/ru` mirrors for money pages.
 * Does NOT include individual template slugs (no public /templates/{slug} route).
 */
export function buildSitemapEntries(opts?: {
  baseUrl?: string;
  blogLocale?: 'ru' | 'kz';
  /** Catalogue routes that currently hold at least one live template. */
  liveCategories?: readonly string[];
}): SitemapUrlEntry[] {
  const baseUrl = (opts?.baseUrl || getSiteOrigin()).replace(/\/$/, '');
  const logical = listSitemapLogicalPaths(opts?.liveCategories);

  const entries: SitemapUrlEntry[] = [];

  for (const path of logical) {
    const normalized = path === '/' ? '' : path;
    entries.push({
      loc: `${baseUrl}${normalized || ''}` || `${baseUrl}/`,
      changefreq: changefreqForPath(path),
      priority: priorityForPath(path),
    });

    // Locale mirrors for indexable marketing surfaces (not legal/auth noise)
    const isMarketing =
      path === '/' ||
      path === '/pricing' ||
      path === '/faq' ||
      path === '/templates' ||
      path.startsWith('/templates/') ||
      path === '/agency' ||
      path === '/uzatu' ||
      path === '/sundet' ||
      path === '/tusaukeser' ||
      path === '/almaty' ||
      path === '/astana' ||
      path === '/wedding' ||
      path === '/betashar' ||
      path === '/mereytoi' ||
      path === '/blog';

    if (isMarketing) {
      for (const loc of SEO_PATH_LOCALES) {
        const locPath = normalized ? `/${loc}${normalized}` : `/${loc}`;
        entries.push({
          loc: `${baseUrl}${locPath}`,
          changefreq: changefreqForPath(path),
          priority: Math.max(0.5, priorityForPath(path) - 0.05),
        });
      }
    }
  }

  const blogPosts = listBlogPosts(opts?.blogLocale ?? 'ru');
  for (const post of blogPosts) {
    entries.push({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.date ? new Date(post.date).toISOString() : undefined,
      changefreq: 'monthly',
      priority: 0.55,
    });
    for (const loc of SEO_PATH_LOCALES) {
      entries.push({
        loc: `${baseUrl}/${loc}/blog/${post.slug}`,
        lastmod: post.date ? new Date(post.date).toISOString() : undefined,
        changefreq: 'monthly',
        priority: 0.5,
      });
    }
  }

  return entries;
}

export function renderSitemapXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((u) => {
      const lastmod = u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '';
      return `  <url>\n    <loc>${u.loc}</loc>\n${lastmod}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}
