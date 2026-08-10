/**
 * Pure plan catalog — single source of truth for prices and feature matrices.
 * No Prisma / React imports.
 *
 * 2026-07-30 SACRED RULE (read docs/PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md + AUDIT_ISSUES.md before touching):
 * For normal single-invite users: pay Template.priceKzt ONCE = fullAccess (no watermark, all guest ops, custom slug, full canvas editor).
 * There is NO "Стандарт / Премиум" upsell in the regular user journey.
 * 'standard'/'premium' SKUs are legacy baggage kept only for:
 *   - historical DB rows / admin
 *   - entitlements engine (migration input)
 *   - legacy pricing tests
 * NEVER surface ladder language ("после Стандарта", "3 990 ₸ за Стандарт", etc.) to end users.
 * If you are thinking "just make it work with the old plan", STOP. This is exactly the infantilism the owner hates.
 */

export const PLAN_SKUS = ['free', 'agency'] as const;
export type PlanSku = (typeof PLAN_SKUS)[number];

/**
 * Legacy plan keys kept in catalog so historical pricing/features still resolve
 * (DB rows + tests). Not part of the modern ladder — see PRODUCT_DECISIONS_2026-07-30.md.
 */
export type LegacyPlanSku = 'standard' | 'premium';
export const LEGACY_PLAN_SKUS: readonly LegacyPlanSku[] = ['standard', 'premium'];

/**
 * Paid subscription SKUs available to the user today.
 * `standard`/`premium` are intentionally NOT part of PAID_PLAN_SKUS anymore —
 * paying the template price = fullAccess. DB rows that still carry legacy SKUs
 * are normalized via the `mapDbPlanSku` helper in `invitation-pricing.ts`.
 */
export const PAID_PLAN_SKUS = ['agency'] as const;
export type PaidPlanSku = (typeof PAID_PLAN_SKUS)[number];

export const PLAN_FEATURES = [
  'publish',
  'watermark',
  'guest_ops',
  'funnel',
  'reminders',
  'seating',
  'household',
  'csv_export',
  'restaurant_link',
  'custom_slug',
  'priority',
  'unlimited_invitations',
] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number];

export type BillingPeriod = 'one_time' | 'monthly';

export interface PlanDefinition {
  sku: PlanSku | LegacyPlanSku;
  priceKzt: number;
  billingPeriod: BillingPeriod;
  /** Rank for comparePlans — higher wins. */
  rank: number;
  invitationLevel: boolean;
  userLevel: boolean;
  features: readonly PlanFeature[];
}

/** Agency subscription length used when completing payment. */
export const AGENCY_DURATION_DAYS = 30;

/** Legacy publication fallback retained only for historical pricing migration. */
export const LEGACY_PUBLICATION_PRICE_KZT = 3_990;

export const PLAN_CATALOG: Record<PlanSku | LegacyPlanSku, PlanDefinition> = {
  free: {
    sku: 'free',
    priceKzt: 0,
    billingPeriod: 'one_time',
    rank: 0,
    invitationLevel: true,
    userLevel: false,
    features: ['publish', 'watermark'],
  },
  standard: {
    sku: 'standard', priceKzt: LEGACY_PUBLICATION_PRICE_KZT, billingPeriod: 'one_time', rank: 10,
    invitationLevel: true, userLevel: false,
    features: ['publish', 'guest_ops', 'funnel', 'reminders', 'seating', 'household', 'csv_export', 'restaurant_link'],
  },
  premium: {
    sku: 'premium', priceKzt: 4_990, billingPeriod: 'one_time', rank: 20,
    invitationLevel: true, userLevel: false,
    features: ['publish', 'guest_ops', 'funnel', 'reminders', 'seating', 'household', 'csv_export', 'restaurant_link', 'custom_slug', 'priority'],
  },
  agency: {
    sku: 'agency',
    priceKzt: 20_000,
    billingPeriod: 'monthly',
    rank: 30,
    invitationLevel: false,
    userLevel: true,
    features: [
      'publish',
      'guest_ops',
      'funnel',
      'reminders',
      'seating',
      'household',
      'csv_export',
      'restaurant_link',
      'custom_slug',
      'priority',
      'unlimited_invitations',
    ],
  },
};

export function isPlanSku(value: string): value is PlanSku {
  return (PLAN_SKUS as readonly string[]).includes(value);
}

export function isLegacyPlanSku(value: string): value is LegacyPlanSku {
  return (LEGACY_PLAN_SKUS as readonly string[]).includes(value);
}

export function isPaidPlanSku(value: string): value is PaidPlanSku {
  return (PAID_PLAN_SKUS as readonly string[]).includes(value);
}

export function getPlanDefinition(sku: PlanSku | LegacyPlanSku): PlanDefinition {
  return PLAN_CATALOG[sku];
}

export function getPlanPriceKzt(sku: PlanSku | LegacyPlanSku): number {
  return PLAN_CATALOG[sku].priceKzt;
}

export function listPaidPlanSkus(): PaidPlanSku[] {
  return [...PAID_PLAN_SKUS];
}

export function comparePlans(a: PlanSku, b: PlanSku): number {
  return PLAN_CATALOG[a].rank - PLAN_CATALOG[b].rank;
}

export function maxPlan(a: PlanSku, b: PlanSku): PlanSku {
  return comparePlans(a, b) >= 0 ? a : b;
}

export function planHasFeature(sku: PlanSku | LegacyPlanSku, feature: PlanFeature): boolean {
  return PLAN_CATALOG[sku].features.includes(feature);
}

/** Default subscription when caller omits planSku — only agency exists now. */
export const AGENCY_UNLOCK_PLAN: PaidPlanSku = 'agency';

/**
 * 2026-07-30 OWNER MODEL (PRODUCT_DECISIONS_2026-07-30.md):
 * For regular users the only meaningful "plan" is "I paid the template price for this invitation".
 * This gives full access. The old ladder (standard/premium) is mostly legacy baggage now.
 * Agency remains the only real subscription product.
 */
