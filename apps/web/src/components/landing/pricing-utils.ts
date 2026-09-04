import { PLAN_CATALOG, type LegacyPlanSku, type PlanSku } from '@/lib/entitlements/plan-catalog';
import { formatKzt } from '@/lib/shared/format-price';

export function formatPlanPriceKzt(sku: PlanSku | LegacyPlanSku): string {
  const amount = PLAN_CATALOG[sku].priceKzt;
  return amount === 0 ? '0' : formatKzt(amount);
}

export function planBillingSuffix(sku: PlanSku | LegacyPlanSku): string {
  return PLAN_CATALOG[sku].billingPeriod === 'monthly' ? '/мес' : '';
}
