/**
 * Pure plan catalog — single source of truth for prices and feature matrices.
 * No Prisma / React imports.
 */

export const PLAN_SKUS = ['free', 'standard', 'premium', 'agency'] as const;
export type PlanSku = (typeof PLAN_SKUS)[number];

export const PAID_PLAN_SKUS = ['standard', 'premium', 'agency'] as const;
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
  sku: PlanSku;
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

export const PLAN_CATALOG: Record<PlanSku, PlanDefinition> = {
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
    sku: 'standard',
    priceKzt: 3_990,
    billingPeriod: 'one_time',
    rank: 10,
    invitationLevel: true,
    userLevel: false,
    features: [
      'publish',
      'guest_ops',
      'funnel',
      'reminders',
      'seating',
      'household',
      'csv_export',
      'restaurant_link',
    ],
  },
  premium: {
    sku: 'premium',
    priceKzt: 4_990,
    billingPeriod: 'one_time',
    rank: 20,
    invitationLevel: true,
    userLevel: false,
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
    ],
  },
  agency: {
    sku: 'agency',
    priceKzt: 9_990,
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

export function isPaidPlanSku(value: string): value is PaidPlanSku {
  return (PAID_PLAN_SKUS as readonly string[]).includes(value);
}

export function getPlanDefinition(sku: PlanSku): PlanDefinition {
  return PLAN_CATALOG[sku];
}

export function getPlanPriceKzt(sku: PlanSku): number {
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

export function planHasFeature(sku: PlanSku, feature: PlanFeature): boolean {
  return PLAN_CATALOG[sku].features.includes(feature);
}

/** Default one-time unlock when checkout intent is `pay` without planSku. */
export const DEFAULT_UNLOCK_PLAN: PaidPlanSku = 'standard';

/** Maps historical single-SKU publication fee to standard. */
export const LEGACY_PUBLICATION_PRICE_KZT = PLAN_CATALOG.standard.priceKzt;
