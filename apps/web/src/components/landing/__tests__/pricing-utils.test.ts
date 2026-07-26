import { describe, expect, it } from 'vitest';

import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { formatPlanPriceKzt, planBillingSuffix } from '@/components/landing/pricing-utils';

describe('pricing-utils', () => {
  it('formats plan prices from PLAN_CATALOG', () => {
    expect(formatPlanPriceKzt('free')).toBe('0');
    expect(formatPlanPriceKzt('standard')).toBe('3\u00a0990');
    expect(formatPlanPriceKzt('premium')).toBe('4\u00a0990');
    expect(formatPlanPriceKzt('agency')).toBe('9\u00a0990');
  });

  it('uses catalog prices, not hardcoded literals', () => {
    expect(formatPlanPriceKzt('standard')).toBe(
      PLAN_CATALOG.standard.priceKzt.toLocaleString('ru-RU'),
    );
  });

  it('marks agency as monthly billing', () => {
    expect(planBillingSuffix('standard')).toBe('');
    expect(planBillingSuffix('agency')).toBe('/мес');
  });
});
