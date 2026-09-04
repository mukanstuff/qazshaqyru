import { describe, expect, it } from 'vitest';

import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { formatPlanPriceKzt, planBillingSuffix } from '@/components/landing/pricing-utils';
import { formatKzt } from '@/lib/shared/format-price';

describe('pricing-utils', () => {
  /**
   * These used to assert a U+00A0 no-break space, and to compare against
   * `toLocaleString('ru-RU')` \u2014 i.e. against whatever separator the *current
   * runtime's* ICU data happens to produce. That is exactly the property that
   * made prices differ between the server render and the browser render and
   * broke hydration on the template preview page. Prices are now formatted
   * deterministically with a plain space (lib/shared/format-price.ts).
   */
  it('formats plan prices from PLAN_CATALOG', () => {
    expect(formatPlanPriceKzt('free')).toBe('0');
    expect(formatPlanPriceKzt('standard')).toBe('3 990');
    expect(formatPlanPriceKzt('premium')).toBe('4 990');
    expect(formatPlanPriceKzt('agency')).toBe('20 000');
  });

  it('uses catalog prices, not hardcoded literals', () => {
    expect(formatPlanPriceKzt('standard')).toBe(formatKzt(PLAN_CATALOG.standard.priceKzt));
  });

  it('is independent of the runtime locale data', () => {
    // No narrow/no-break spaces, no commas \u2014 the same bytes everywhere.
    expect(formatKzt(3990)).toBe('3 990');
    expect(formatKzt(1234567)).toBe('1 234 567');
    expect(/[\u00a0\u202f,]/.test(formatKzt(1234567))).toBe(false);
  });

  it('marks agency as monthly billing', () => {
    expect(planBillingSuffix('standard')).toBe('');
    expect(planBillingSuffix('agency')).toBe('/мес');
  });
});
