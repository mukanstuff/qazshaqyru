/**
 * Catalog constants.
 *
 * This file used to declare `CATALOG_TEMPLATE_SLUG = 'luxe-gold'` and re-export
 * it as `DEFAULT_TEMPLATE_SLUG` — the fallback slug used whenever a caller had
 * no template to work with. `luxe-gold` has never existed as a row in the
 * Template table: the live catalog is `aq-bata`, `dala` and
 * `elegant-gold-wedding-01`. Every path that fell back to it therefore produced
 * a URL, a preview fetch or an Invitation row pointing at nothing — the landing
 * page's `/i/demo?layout=luxe-gold` link was the visible symptom, but the same
 * phantom was also the default templateKey for invitation creation.
 *
 * There is no such thing as a "default template": a template is always an
 * explicit choice by the person creating the invitation, or there is no
 * template at all (see /editor/new, which seeds a blank canvas instead).
 * Callers that need one must now pass it, and the type system enforces that.
 */

/**
 * 2026-07-30 PRODUCT MODEL (see docs/PRODUCT_MODEL_AND_RULES.md +
 * PRODUCT_DECISIONS_2026-07-30.md):
 * Real price is ALWAYS Template.priceKzt (resolved via
 * resolvePublicationPriceKzt). This threshold is purely for when admin decides
 * to lower the *minimum* catalog template price.
 * Never hardcode 3990 in user-facing copy or CTAs.
 */
export const CATALOG_PRICE_DROP_THRESHOLD = 15;
