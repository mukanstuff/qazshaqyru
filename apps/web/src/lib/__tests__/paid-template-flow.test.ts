import { describe, expect, it } from 'vitest';
import { resolvePaidTemplateOrder } from '@/lib/invitations/invitation-pricing';
import { shouldShowPublishWatermark } from '@/lib/invitations/publish-watermark';
import { resolveEntitlements } from '@/lib/entitlements/resolve-entitlements';

describe('paid template flow', () => {
  it('unlocks all invitation entitlements after template payment', () => {
    const entitlements = resolveEntitlements({
      now: new Date('2026-08-01T12:00:00Z'),
      user: { planSku: null, planExpiresAt: null },
      invitation: { unlockedPlanSku: 'standard' },
    });

    expect(resolvePaidTemplateOrder(14900, 14900)).toBe(true);
    expect(entitlements.guestOps).toBe(true);
    // 2026-07-30 owner model: any unlocked paid plan on an invitation = fullAccess,
    // so `customSlug` is true (the legacy "standard had no customSlug" tier is gone).
    expect(entitlements.customSlug).toBe(true);
    expect(shouldShowPublishWatermark({
      priceKzt: 14900,
      hasPaidOrder: true,
      fullAccess: true,
      entitlements,
    })).toBe(false);
  });

  it('keeps unpaid drafts behind watermark and guest-ops gate', () => {
    const entitlements = resolveEntitlements({
      now: new Date('2026-08-01T12:00:00Z'),
      user: { planSku: null, planExpiresAt: null },
      invitation: { unlockedPlanSku: null },
    });

    expect(resolvePaidTemplateOrder(0, 14900)).toBe(false);
    expect(entitlements.guestOps).toBe(false);
    expect(entitlements.customSlug).toBe(false);
    expect(shouldShowPublishWatermark({
      priceKzt: 14900,
      hasPaidOrder: false,
      fullAccess: false,
      entitlements,
    })).toBe(true);
  });

  it('requires topping up when switching to a pricier template, but stays free for equal-or-cheaper', () => {
    // Paid 2990 for a cheap template — enough to unlock it...
    expect(resolvePaidTemplateOrder(2990, 2990)).toBe(true);
    // ...but not enough to unlock a pricier one without a top-up order.
    expect(resolvePaidTemplateOrder(2990, 4990)).toBe(false);
    // Having paid more than a cheaper template costs keeps it unlocked for free.
    expect(resolvePaidTemplateOrder(4990, 2990)).toBe(true);
  });

  it('resolves agency as user-level subscription without invitation', () => {
    const entitlements = resolveEntitlements({
      now: new Date('2026-08-01T12:00:00Z'),
      user: { planSku: 'agency', planExpiresAt: new Date('2026-09-01T12:00:00Z') },
      invitation: { unlockedPlanSku: null },
    });

    expect(entitlements.source).toBe('user');
    expect(entitlements.planSku).toBe('agency');
    expect(entitlements.unlimitedInvitations).toBe(true);
  });
});
