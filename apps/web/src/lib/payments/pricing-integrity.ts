/** Pure pricing rules — safe to unit-test without DB. */

export interface OrderPricingSnapshot {
  templateId: string | null;
  amountKzt: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
}

/**
 * A paid order counts only when it matches the current template and covers the price.
 */
export function isValidPaidOrder(
  order: OrderPricingSnapshot | null | undefined,
  currentTemplateId: string | null,
  currentPriceKzt: number
): boolean {
  if (!order || order.status !== 'paid') return false;
  if (!currentTemplateId || !order.templateId) return false;
  if (order.templateId !== currentTemplateId) return false;
  return order.amountKzt >= currentPriceKzt;
}

/** Pending checkout must match current template and amount. */
export function isStalePendingOrder(
  order: OrderPricingSnapshot,
  currentTemplateId: string | null,
  currentPriceKzt: number
): boolean {
  if (order.status !== 'pending') return false;
  if (!currentTemplateId || !order.templateId) return true;
  return order.templateId !== currentTemplateId || order.amountKzt !== currentPriceKzt;
}

export function requiresPaymentToPublish(priceKzt: number, hasValidPaidOrder: boolean): boolean {
  if (priceKzt === 0) return false;
  return !hasValidPaidOrder;
}
