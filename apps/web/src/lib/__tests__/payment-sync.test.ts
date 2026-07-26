import { describe, it, expect } from 'vitest';
import { parseKaspiAmountTyiyn, amountsMatch } from '@/lib/payments/payment-amount';

describe('payment amount helpers', () => {
  it('parses tyiyn to KZT', () => {
    expect(parseKaspiAmountTyiyn(1490000)).toBe(14900);
  });

  it('rejects invalid amounts', () => {
    expect(parseKaspiAmountTyiyn(undefined)).toBe(null);
    expect(parseKaspiAmountTyiyn('x')).toBe(null);
  });

  it('matches equal amounts', () => {
    expect(amountsMatch(14900, 14900)).toBe(true);
    expect(amountsMatch(14900, 9900)).toBe(false);
  });
});
