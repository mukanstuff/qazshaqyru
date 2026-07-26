/**
 * Catalog rollout — only slugs listed here appear on /templates and in create defaults.
 * Designer delivers assets; agents register slug here when ready (HOW-TO-ADD-A-TEMPLATE.md).
 * Do not add placeholders or AI-generated «pretty» backgrounds.
 */
export const CATALOG_TEMPLATE_SLUG = 'wedding-luxury' as const;

export const DEFAULT_TEMPLATE_SLUG = CATALOG_TEMPLATE_SLUG;

export const CATALOG_TEMPLATE_SLUGS = [CATALOG_TEMPLATE_SLUG] as const;

export type CatalogTemplateSlug = (typeof CATALOG_TEMPLATE_SLUGS)[number];

export function isCatalogTemplateSlug(slug: string): slug is CatalogTemplateSlug {
  return (CATALOG_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}

/** Live sales count — used for Standard price decision (≥15 → consider 2 990). */
export function catalogLiveCount(): number {
  return CATALOG_TEMPLATE_SLUGS.length;
}

/**
 * Standard entry stays 3 990 until catalog has enough choice.
 * Price change is a conscious product decision in plan-catalog.ts — not auto.
 */
export const CATALOG_PRICE_DROP_THRESHOLD = 15;
