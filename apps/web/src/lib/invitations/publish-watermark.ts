import type { InvitationPricing } from '@/lib/invitations/invitation-pricing';
import type { ResolvedEntitlements } from '@/lib/entitlements';

/**
 * Freemium: publish is free; paid plan / agency removes public watermark.
 */
export function shouldShowPublishWatermark(
  pricing: Pick<InvitationPricing, 'priceKzt' | 'hasPaidOrder' | 'entitlements'> | {
    priceKzt: number;
    hasPaidOrder: boolean;
    entitlements?: Pick<ResolvedEntitlements, 'watermark'>;
  }
): boolean {
  if (pricing.entitlements) {
    return pricing.entitlements.watermark;
  }
  // Unlock price is never a "free = no watermark" signal — unpaid always watermarks.
  return !pricing.hasPaidOrder;
}

export function canPublishWithoutPayment(): boolean {
  return true;
}
