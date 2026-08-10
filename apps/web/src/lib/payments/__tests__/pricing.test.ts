import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/shared/api';
import {
  AGENCY_DURATION_DAYS,
  getPlanDefinition,
} from '@/lib/entitlements';
import {
  AGENCY_ORDER_PLAN_SKU,
  TEMPLATE_ORDER_PLAN_SKU,
  determineCheckout,
} from '@/lib/payments/pricing';

describe('determineCheckout', () => {
  describe('template purchase (intent=pay)', () => {
    it('charges the template price, NOT the agency price', () => {
      const routing = determineCheckout({
        intent: 'pay',
        templatePriceKzt: 3990,
        templateName: 'Роскошная свадьба',
      });

      expect(routing.productType).toBe('template');
      expect(routing.chargeAmountKzt).toBe(3990);
      expect(routing.orderPlanSku).toBe(TEMPLATE_ORDER_PLAN_SKU);
      expect(routing.planScope).toBe('invitation');
      expect(routing.planDurationDays).toBeNull();
    });

    it('never activates user-level agency for a template purchase', () => {
      const routing = determineCheckout({
        intent: 'pay',
        templatePriceKzt: 3990,
        templateName: 'Wedding-luxury',
      });

      // Critical regression guard — the bug was charging 20,000 KZT
      // and activating agency plan because planSku defaulted to 'agency'.
      expect(routing.chargeAmountKzt).not.toBe(getPlanDefinition('agency').priceKzt);
      expect(routing.orderPlanSku).not.toBe(AGENCY_ORDER_PLAN_SKU);
      expect(routing.planScope).not.toBe('user');
    });

    it('rejects template purchase with missing/zero price', () => {
      expect(() =>
        determineCheckout({ intent: 'pay', templatePriceKzt: 0, templateName: 'X' })
      ).toThrow(ApiError);
    });
  });

  describe('agency subscription', () => {
    it('charges the agency price via explicit intent: agency', () => {
      const routing = determineCheckout({
        intent: 'agency',
        requestedPlanSku: 'agency',
        templatePriceKzt: 0,
        templateName: '',
      });

      expect(routing.productType).toBe('agency');
      expect(routing.orderPlanSku).toBe(AGENCY_ORDER_PLAN_SKU);
      expect(routing.planScope).toBe('user');
      expect(routing.planDurationDays).toBe(AGENCY_DURATION_DAYS);
      expect(routing.chargeAmountKzt).toBe(getPlanDefinition('agency').priceKzt);
    });

    it('accepts legacy intent: plan + planSku=agency alias', () => {
      const routing = determineCheckout({
        intent: 'plan',
        requestedPlanSku: 'agency',
        templatePriceKzt: 0,
        templateName: '',
      });

      expect(routing.productType).toBe('agency');
      expect(routing.chargeAmountKzt).toBe(getPlanDefinition('agency').priceKzt);
    });
  });

  describe('rejection of invalid combinations', () => {
    it('rejects intent: plan without agency planSku', () => {
      // Legacy standard/premium ladder is gone — bare "plan" intent is meaningless.
      expect(() =>
        determineCheckout({
          intent: 'plan',
          requestedPlanSku: null,
          templatePriceKzt: 3990,
          templateName: 'X',
        })
      ).toThrow(ApiError);
    });

    it('rejects intent: pay + planSku=agency (no template upgrade hack)', () => {
      expect(() =>
        determineCheckout({
          intent: 'pay',
          requestedPlanSku: 'agency',
          templatePriceKzt: 3990,
          templateName: 'X',
        })
      ).toThrow(ApiError);
    });
  });

  describe('admin publish (legacy)', () => {
    it('routes publish intent to template purchase with template price', () => {
      const routing = determineCheckout({
        intent: 'publish',
        templatePriceKzt: 3990,
        templateName: 'X',
      });

      expect(routing.productType).toBe('template');
      expect(routing.chargeAmountKzt).toBe(3990);
    });
  });
});