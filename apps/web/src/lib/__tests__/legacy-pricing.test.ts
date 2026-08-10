import { describe, expect, it } from 'vitest';
import { getPlanPriceKzt, planHasFeature } from '@/lib/entitlements/plan-catalog';

// LEGACY: standard/premium SKU удалены 2026-08-01, оставлены как reference для миграции данных.
describe('legacy pricing reference', () => {
  it('retains historical price values only as migration reference', () => {
    expect(getPlanPriceKzt('standard')).toBe(3990);
    expect(getPlanPriceKzt('premium')).toBe(4990);
  });

  it('retains historical entitlement shape for migration reference', () => {
    expect(planHasFeature('standard', 'guest_ops')).toBe(true);
    expect(planHasFeature('premium', 'custom_slug')).toBe(true);
  });
});
