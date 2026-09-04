import type { InvitationPricing } from '@/lib/invitations/invitation-pricing';
import type { ResolvedEntitlements } from '@/lib/entitlements';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRODUCT RULE (2026-08-26) — READ THIS BEFORE TOUCHING
 * ═══════════════════════════════════════════════════════════════════════════
 * Free tier: any invitation can publish unpaid, watermarked (PLAN_CATALOG
 * 'free' plan). Pay the template price ONCE → full clean access (no
 * watermark, all features) for that invitation. This file must always
 * return true for a paid (fullAccess) invitation and true-by-default
 * (watermark shown) for an unpaid one.
 */
export function shouldShowPublishWatermark(
  pricing: Pick<InvitationPricing, 'priceKzt' | 'hasPaidOrder' | 'entitlements' | 'fullAccess'> | {
    priceKzt: number;
    hasPaidOrder: boolean;
    entitlements?: Pick<ResolvedEntitlements, 'watermark'>;
    fullAccess?: boolean;
  }
): boolean {
  // 2026-07-30 OWNER MODEL (P0-2): paid template order = fullAccess = NO watermark on published page.
  // fullAccess (from getInvitationPricing) or hasPaidOrder takes precedence.
  // entitlements.watermark only for legacy/unpaid cases.
  if ((pricing as any).fullAccess === true) return false;
  if (pricing.hasPaidOrder) return false;

  if (pricing.entitlements) {
    return pricing.entitlements.watermark;
  }
  return !pricing.hasPaidOrder;
}

export function canPublishWithoutPayment(): boolean {
  // 2026-08-26: free-tier restored — any invitation can publish unpaid with
  // a watermark (shouldShowPublishWatermark above governs when it shows).
  return true;
}
