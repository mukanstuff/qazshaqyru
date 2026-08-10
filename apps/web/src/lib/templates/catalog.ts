/**
 * Catalog rollout — only slugs listed here appear on /templates and in create defaults.
 * Designer delivers assets; agents register slug here when ready (HOW-TO-ADD-A-TEMPLATE.md).
 * Do not add placeholders or AI-generated «pretty» backgrounds.
 */
export const CATALOG_TEMPLATE_SLUG = 'luxe-gold' as const;

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
 * 2026-07-30 PRODUCT MODEL (see docs/PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md):
 * Real price is ALWAYS Template.priceKzt (resolved via resolvePublicationPriceKzt).
 * This threshold is purely for when admin decides to lower the *minimum* catalog template price.
 * Never hardcode 3990 in user-facing copy or CTAs.
 */
export const CATALOG_PRICE_DROP_THRESHOLD = 15;
