/**
 * Shared Kaspi amount parsing — webhook and poll/sync must use the same rules.
 * Kaspi sends amounts in tyiyn (1/100 KZT).
 */
export function parseKaspiAmountTyiyn(amount: unknown): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
  return Math.round(amount / 100);
}

export function amountsMatch(orderAmountKzt: number, paidAmountKzt: number): boolean {
  return orderAmountKzt === paidAmountKzt;
}
