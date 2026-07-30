import {
  type PlanFeature,
  type PlanSku,
  maxPlan,
  planHasFeature,
} from '@/lib/entitlements/plan-catalog';

export type EntitlementSource = 'free' | 'invitation' | 'user';

export interface UserEntitlementSnapshot {
  planSku: PlanSku | null;
  planExpiresAt: Date | null;
}

export interface InvitationEntitlementSnapshot {
  unlockedPlanSku: PlanSku | null;
}

export interface ResolvedEntitlements {
  planSku: PlanSku;
  source: EntitlementSource;
  expiresAt: Date | null;
  watermark: boolean;
  guestOps: boolean;
  funnel: boolean;
  reminders: boolean;
  seating: boolean;
  household: boolean;
  csvExport: boolean;
  restaurantLink: boolean;
  customSlug: boolean;
  priority: boolean;
  unlimitedInvitations: boolean;
}

function activeUserPlan(
  user: UserEntitlementSnapshot,
  now: Date
): { sku: PlanSku; expiresAt: Date } | null {
  if (!user.planSku || user.planSku === 'free') return null;
  if (!user.planExpiresAt || user.planExpiresAt.getTime() <= now.getTime()) return null;
  return { sku: user.planSku, expiresAt: user.planExpiresAt };
}

function featureFlags(sku: PlanSku): Omit<
  ResolvedEntitlements,
  'planSku' | 'source' | 'expiresAt' | 'watermark'
> {
  const has = (f: PlanFeature) => planHasFeature(sku, f);
  return {
    guestOps: has('guest_ops'),
    funnel: has('funnel'),
    reminders: has('reminders'),
    seating: has('seating'),
    household: has('household'),
    csvExport: has('csv_export'),
    restaurantLink: has('restaurant_link'),
    customSlug: has('custom_slug'),
    priority: has('priority'),
    unlimitedInvitations: has('unlimited_invitations'),
  };
}

/**
 * Resolve effective entitlements for a user (+ optional invitation).
 * Pure — load DB snapshots before calling.
 */
export function resolveEntitlements(params: {
  now: Date;
  user: UserEntitlementSnapshot;
  invitation?: InvitationEntitlementSnapshot | null;
}): ResolvedEntitlements {
  const { now, user, invitation } = params;
  const agency = activeUserPlan(user, now);

  if (agency) {
    return {
      planSku: agency.sku,
      source: 'user',
      expiresAt: agency.expiresAt,
      watermark: planHasFeature(agency.sku, 'watermark'),
      ...featureFlags(agency.sku),
    };
  }

  const unlocked =
    invitation?.unlockedPlanSku && invitation.unlockedPlanSku !== 'free'
      ? invitation.unlockedPlanSku
      : null;

  if (unlocked) {
    // Product decision 2026-07-30: "standard" (or higher) unlock on an invitation
    // now means FULL ACCESS for that single invitation (template purchase model).
    // No more partial standard vs premium split for regular users.
    return {
      planSku: unlocked,
      source: 'invitation',
      expiresAt: null,
      watermark: planHasFeature(unlocked, 'watermark'),
      ...featureFlags(unlocked),
    };
  }

  return {
    planSku: 'free',
    source: 'free',
    expiresAt: null,
    watermark: true,
    ...featureFlags('free'),
  };
}

/** Higher of two plan SKUs (null treated as free). */
export function mergePlanSkus(a: PlanSku | null | undefined, b: PlanSku | null | undefined): PlanSku {
  return maxPlan(a ?? 'free', b ?? 'free');
}

export function hasFeature(
  entitlements: ResolvedEntitlements,
  feature: PlanFeature
): boolean {
  switch (feature) {
    case 'publish':
      return true;
    case 'watermark':
      return entitlements.watermark;
    case 'guest_ops':
      return entitlements.guestOps;
    case 'funnel':
      return entitlements.funnel;
    case 'reminders':
      return entitlements.reminders;
    case 'seating':
      return entitlements.seating;
    case 'household':
      return entitlements.household;
    case 'csv_export':
      return entitlements.csvExport;
    case 'restaurant_link':
      return entitlements.restaurantLink;
    case 'custom_slug':
      return entitlements.customSlug;
    case 'priority':
      return entitlements.priority;
    case 'unlimited_invitations':
      return entitlements.unlimitedInvitations;
    default:
      return false;
  }
}
