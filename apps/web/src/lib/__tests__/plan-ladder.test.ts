import { describe, expect, it } from 'vitest';
import {
  PLAN_CATALOG,
  isPaidPlanSku,
  planHasFeature,
} from '@/lib/entitlements/plan-catalog';
import { resolveEntitlements } from '@/lib/entitlements/resolve-entitlements';
import { resolvePaidTemplateOrder } from '@/lib/invitations/invitation-pricing';
import { computeGuestFunnel } from '@/lib/guests/guest-funnel';
import {
  createRestaurantShareToken,
  isRestaurantShareActive,
  parseRestaurantShareToken,
  verifyRestaurantShareToken,
} from '@/lib/restaurant/share-token';
import { buildRestaurantPortalPayload } from '@/lib/restaurant/portal-data';
import { shouldShowPublishWatermark } from '@/lib/invitations/publish-watermark';

describe('plan catalog', () => {
  it('keeps agency as only subscription plan', () => {
    expect(PLAN_CATALOG.agency.priceKzt).toBe(20000);
    expect(PLAN_CATALOG.agency.billingPeriod).toBe('monthly');
    expect(PLAN_CATALOG.agency.userLevel).toBe(true);
    expect(isPaidPlanSku('agency')).toBe(true);
  });

  it('resolves invitation payment as full access', () => {
    expect(planHasFeature('agency', 'unlimited_invitations')).toBe(true);
    expect(shouldShowPublishWatermark({
      priceKzt: 14900,
      hasPaidOrder: true,
      fullAccess: true,
      entitlements: { watermark: true },
    })).toBe(false);
  });
});

describe('resolveEntitlements', () => {
  const now = new Date('2026-07-16T12:00:00Z');

  it('defaults to free with watermark', () => {
    const e = resolveEntitlements({
      now,
      user: { planSku: null, planExpiresAt: null },
      invitation: { unlockedPlanSku: null },
    });
    expect(e.planSku).toBe('free');
    expect(e.watermark).toBe(true);
    expect(e.guestOps).toBe(false);
  });

  it('uses paid template flag for full access expectations', () => {
    expect(resolvePaidTemplateOrder(true, null)).toBe(true);
    expect(resolvePaidTemplateOrder(false, null)).toBe(false);
  });

  it('uses invitation unlock only as legacy migration input', () => {
    const e = resolveEntitlements({
      now,
      user: { planSku: null, planExpiresAt: null },
      invitation: { unlockedPlanSku: 'standard' },
    });
    expect(e.source).toBe('invitation');
    expect(e.watermark).toBe(false);
    expect(e.guestOps).toBe(true);
    expect(e.restaurantLink).toBe(true);
  });

  it('prefers active agency over invitation', () => {
    const e = resolveEntitlements({
      now,
      user: {
        planSku: 'agency',
        planExpiresAt: new Date('2026-08-16T12:00:00Z'),
      },
      invitation: { unlockedPlanSku: 'standard' },
    });
    expect(e.source).toBe('user');
    expect(e.planSku).toBe('agency');
    expect(e.customSlug).toBe(true);
    expect(e.unlimitedInvitations).toBe(true);
  });

  it('ignores expired agency', () => {
    const e = resolveEntitlements({
      now,
      user: {
        planSku: 'agency',
        planExpiresAt: new Date('2026-06-01T12:00:00Z'),
      },
      invitation: { unlockedPlanSku: null },
    });
    expect(e.planSku).toBe('free');
    expect(e.watermark).toBe(true);
  });
});

describe('guest funnel', () => {
  it('computes opened/sent/responded', () => {
    const stats = computeGuestFunnel([
      { id: '1', sentAt: new Date(), openedAt: new Date(), responseStatus: 'attending' },
      { id: '2', sentAt: new Date(), openedAt: null, responseStatus: 'pending' },
      { id: '3', sentAt: null, openedAt: null, responseStatus: 'pending' },
    ]);
    expect(stats.total).toBe(3);
    expect(stats.sent).toBe(2);
    expect(stats.opened).toBe(1);
    expect(stats.responded).toBe(1);
    expect(stats.sentNotOpened).toBe(1);
  });
});

describe('restaurant share token', () => {
  it('round-trips hash.mac token', () => {
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET || 'test-session-secret-32chars-minimum!!';
    const { token, tokenHash } = createRestaurantShareToken();
    const parsed = parseRestaurantShareToken(token);
    expect(parsed?.tokenHash).toBe(tokenHash);
    expect(verifyRestaurantShareToken(token, tokenHash)).toBe(true);
    expect(verifyRestaurantShareToken(token, 'deadbeef'.repeat(8))).toBe(false);
  });

  it('detects expired/revoked', () => {
    expect(
      isRestaurantShareActive({
        revokedAt: null,
        expiresAt: new Date('2099-01-01'),
        now: new Date('2026-07-16'),
      })
    ).toBe(true);
    expect(
      isRestaurantShareActive({
        revokedAt: new Date(),
        expiresAt: new Date('2099-01-01'),
      })
    ).toBe(false);
  });
});

describe('restaurant portal payload', () => {
  it('aggregates households and seats', () => {
    const payload = buildRestaurantPortalPayload({
      title: 'Той',
      eventDate: new Date('2026-08-01'),
      eventTime: '18:00',
      eventPlace: 'Алматы',
      address: null,
      guests: [
        {
          id: '1',
          name: 'Асет',
          householdLabel: 'Асетовы',
          responseStatus: 'attending',
          hasPlusOne: false,
        },
        {
          id: '2',
          name: 'Айым',
          householdLabel: 'Асетовы',
          responseStatus: 'attending_plus_one',
          hasPlusOne: true,
        },
      ],
    });
    expect(payload.confirmedSeats).toBe(3);
    expect(payload.households).toHaveLength(1);
    expect(payload.households[0]?.guests).toHaveLength(2);
  });
});

describe('watermark with entitlements', () => {
  it('uses entitlements.watermark when present', () => {
    expect(
      shouldShowPublishWatermark({
        priceKzt: 3990,
        hasPaidOrder: false,
        entitlements: { watermark: false },
      })
    ).toBe(false);
    expect(
      shouldShowPublishWatermark({
        priceKzt: 3990,
        hasPaidOrder: false,
        entitlements: { watermark: true },
      })
    ).toBe(true);
  });
});
