import { describe, it, expect } from 'vitest';
import {
  isValidPaidOrder,
  isStalePendingOrder,
  requiresPaymentToPublish,
} from '@/lib/payments/pricing-integrity';

describe('pricing integrity', () => {
  it('accepts paid order matching template and price', () => {
    expect(
      isValidPaidOrder(
        { templateId: 'tpl-1', amountKzt: 14900, status: 'paid' },
        'tpl-1',
        14900
      )
    ).toBe(true);
  });

  it('rejects paid order for different template', () => {
    expect(
      isValidPaidOrder(
        { templateId: 'tpl-cheap', amountKzt: 5000, status: 'paid' },
        'tpl-expensive',
        14900
      )
    ).toBe(false);
  });

  it('rejects underpaid order for current price', () => {
    expect(
      isValidPaidOrder(
        { templateId: 'tpl-1', amountKzt: 5000, status: 'paid' },
        'tpl-1',
        14900
      )
    ).toBe(false);
  });

  it('allows higher paid amount after price drop', () => {
    expect(
      isValidPaidOrder(
        { templateId: 'tpl-1', amountKzt: 14900, status: 'paid' },
        'tpl-1',
        9900
      )
    ).toBe(true);
  });

  it('detects stale pending order after template change', () => {
    expect(
      isStalePendingOrder(
        { templateId: 'tpl-old', amountKzt: 14900, status: 'pending' },
        'tpl-new',
        14900
      )
    ).toBe(true);
  });

  it('detects stale pending order after price change', () => {
    expect(
      isStalePendingOrder(
        { templateId: 'tpl-1', amountKzt: 5000, status: 'pending' },
        'tpl-1',
        14900
      )
    ).toBe(true);
  });

  it('requires payment when template is paid and no valid order', () => {
    expect(requiresPaymentToPublish(14900, false)).toBe(true);
    expect(requiresPaymentToPublish(0, false)).toBe(false);
    expect(requiresPaymentToPublish(14900, true)).toBe(false);
  });
});
