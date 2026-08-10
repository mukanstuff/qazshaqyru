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

    expect(resolvePaidTemplateOrder(true, null)).toBe(true);
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

    expect(resolvePaidTemplateOrder(false, null)).toBe(false);
    expect(entitlements.guestOps).toBe(false);
    expect(entitlements.customSlug).toBe(false);
    expect(shouldShowPublishWatermark({
      priceKzt: 14900,
      hasPaidOrder: false,
      fullAccess: false,
      entitlements,
    })).toBe(true);
  });

  it('migrates legacy standard and premium invitation unlocks', () => {
    expect(resolvePaidTemplateOrder(false, 'standard')).toBe(true);
    expect(resolvePaidTemplateOrder(false, 'premium')).toBe(true);
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
