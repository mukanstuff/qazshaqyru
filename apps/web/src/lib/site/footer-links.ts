/** Unified consumer-site footer destinations (labels via i18n). */
export const SITE_FOOTER_LINK_KEYS = [
  { href: '/templates', labelKey: 'site.footer.templates' },
  { href: '/pricing', labelKey: 'site.footer.pricing' },
  { href: '/faq', labelKey: 'site.footer.faq' },
  { href: '/blog', labelKey: 'site.footer.blog' },
  { href: '/about', labelKey: 'site.footer.about' },
  { href: '/contacts', labelKey: 'site.footer.contacts' },
  { href: '/offer', labelKey: 'site.footer.offer' },
  { href: '/terms', labelKey: 'site.footer.terms' },
  { href: '/privacy', labelKey: 'site.footer.privacy' },
  { href: '/refund', labelKey: 'site.footer.refund' },
] as const;

/** Crawl-depth helpers: event LP and cities — useful for guests & bots. */
export const SITE_FOOTER_SEO_LINKS = [
  { href: '/uzatu', labelRu: 'Узату', labelKz: 'Ұзату' },
  { href: '/sundet', labelRu: 'Сүндет', labelKz: 'Сүндет' },
  { href: '/tusaukeser', labelRu: 'Тұсаукесер', labelKz: 'Тұсаукесер' },
  { href: '/wedding', labelRu: 'Свадьба', labelKz: 'Үйлену той' },
  { href: '/betashar', labelRu: 'Беташар', labelKz: 'Беташар' },
  { href: '/almaty', labelRu: 'Алматы', labelKz: 'Алматы' },
  { href: '/astana', labelRu: 'Астана', labelKz: 'Астана' },
] as const;

/**
 * Indexable static paths for sitemap (no auth, no noindex surfaces).
 * Template category routes are added separately via CATEGORY_ROUTES.
 * Individual template slugs are NOT listed — there is no public /templates/{slug} page.
 */
export const SITEMAP_STATIC_PATHS = [
  '',
  '/templates',
  '/pricing',
  '/agency',
  '/uzatu',
  '/sundet',
  '/tusaukeser',
  '/wedding',
  '/betashar',
  '/mereytoi',
  '/almaty',
  '/astana',
  '/compare/done-for-you',
  '/blog',
  '/faq',
  '/about',
  '/contacts',
  '/offer',
  '/terms',
  '/privacy',
  '/refund',
] as const;
