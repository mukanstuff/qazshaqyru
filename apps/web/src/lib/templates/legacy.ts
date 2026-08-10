/**
 * Maps legacy / removed invitation templateKey values to the active Phase-1 template.
 * Single-template Phase 1: every legacy slug points to `luxe-gold` until the catalog grows.
 */
export const LEGACY_TEMPLATE_MAP: Record<string, string> = {
  classic: 'luxe-gold',
  elegant: 'luxe-gold',
  golden: 'luxe-gold',
  nature: 'luxe-gold',
  romantic: 'luxe-gold',
  modern: 'luxe-gold',
  'starter-blank': 'luxe-gold',
  'wedding-rose-blush': 'luxe-gold',
};
