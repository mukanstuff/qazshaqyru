import type { InvitationPricing } from '@/lib/invitations/invitation-pricing';
import type { ResolvedEntitlements } from '@/lib/entitlements';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRODUCT RULE (2026-07-30) — READ THIS BEFORE TOUCHING
 * ═══════════════════════════════════════════════════════════════════════════
 * Pay the template price ONCE → full clean access (no watermark, all features).
 * 
 * This file should almost never return true for paid invitations.
 * "Freemium publish" is legacy and being removed from user flows.
 * 
 * See: docs/PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md
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
  // Changed to reflect owner model: clean public link after paying template price.
  return false;
}
