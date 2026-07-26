import { listBlogPosts } from '@/lib/blog/posts';
import { CATEGORY_ROUTES } from '@/lib/templates/template-categories';
import { SITEMAP_STATIC_PATHS } from '@/lib/site/footer-links';
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
  if (path.startsWith('/compare/')) return 0.7;
  if (path.startsWith('/blog/')) return 0.55;
  return 0.65;
}

function changefreqForPath(path: string): SitemapUrlEntry['changefreq'] {
  if (path === '' || path === '/' || path === '/blog' || path === '/templates') return 'weekly';
  return 'monthly';
}

/** Logical paths that should appear in sitemap (no locale prefix, no auth). */
export function listSitemapLogicalPaths(): string[] {
  const categories = CATEGORY_ROUTES.map((c) => `/templates/${c}`);
  const staticPaths = SITEMAP_STATIC_PATHS.map((p) => (p === '' ? '/' : p));
  return Array.from(new Set([...staticPaths, ...categories]));
}

/**
 * Build sitemap entries.
 * Includes unprefixed URLs (x-default) and `/kk` + `/ru` mirrors for money pages.
 * Does NOT include individual template slugs (no public /templates/{slug} route).
 */
export function buildSitemapEntries(opts?: {
  baseUrl?: string;
  blogLocale?: 'ru' | 'kz';
}): SitemapUrlEntry[] {
  const baseUrl = (opts?.baseUrl || getSiteOrigin()).replace(/\/$/, '');
  const logical = listSitemapLogicalPaths();

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
      path.startsWith('/compare/') ||
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
