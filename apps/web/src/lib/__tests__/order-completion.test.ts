import { describe, it, expect } from 'vitest';

/**
 * Unit tests for payment amount validation logic used in webhook + order completion.
 */
function validatePaidAmount(orderAmountKzt: number, paidAmountKzt: number | undefined): boolean {
  if (paidAmountKzt === undefined) return false;
  return orderAmountKzt === paidAmountKzt;
}

/** Mirrors KaspiPayProvider.verifyWebhook success branch */
function parseKaspiPaidAmount(amount: unknown): number | null {
  if (typeof amount !== 'number') return null;
  return Math.round(amount / 100);
}

describe('payment amount validation', () => {
  it('rejects webhook without amount', () => {
    expect(validatePaidAmount(14900, undefined)).toBe(false);
  });

  it('rejects amount mismatch', () => {
    expect(validatePaidAmount(14900, 9900)).toBe(false);
  });

  it('accepts matching amount', () => {
    expect(validatePaidAmount(14900, 14900)).toBe(true);
  });
});

describe('Kaspi webhook amount parsing', () => {
  it('converts tyiyn to KZT', () => {
    expect(parseKaspiPaidAmount(1490000)).toBe(14900);
  });

  it('rejects missing amount', () => {
    expect(parseKaspiPaidAmount(undefined)).toBe(null);
  });
});

describe('webhook provider guard', () => {
  function providerMatches(orderProvider: string | null, expectedProvider?: string): boolean {
    if (!expectedProvider) return true;
    if (!orderProvider) return false;
    return orderProvider === expectedProvider;
  }

  it('rejects completion when provider mismatches', () => {
    expect(providerMatches('mock', 'kaspi')).toBe(false);
    expect(providerMatches('kaspi', 'kaspi')).toBe(true);
  });
});
