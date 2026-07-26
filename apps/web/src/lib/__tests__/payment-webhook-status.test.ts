import { describe, it, expect } from 'vitest';
import {
  parseFreedomWebhookPayload,
  parseKaspiWebhookPayload,
} from '@/lib/payments/payment-webhook-status';

describe('parseKaspiWebhookPayload', () => {
  it('completes on success with amount in tyiyn', () => {
    const result = parseKaspiWebhookPayload({
      order_id: 'ord-1',
      status: 'success',
      amount: 1490000,
    });
    expect(result).toEqual({
      orderId: 'ord-1',
      action: 'complete',
      paidAmountKzt: 14900,
    });
  });

  it('ignores pending status', () => {
    expect(
      parseKaspiWebhookPayload({ order_id: 'ord-1', status: 'pending', amount: 1490000 })
    ).toEqual({
      orderId: 'ord-1',
      action: 'ignore',
      paidAmountKzt: 14900,
    });
  });

  it('cancels on explicit failure', () => {
    expect(parseKaspiWebhookPayload({ order_id: 'ord-1', status: 'failed' })).toEqual({
      orderId: 'ord-1',
      action: 'cancel',
    });
  });

  it('requires amount for complete action', () => {
    expect(parseKaspiWebhookPayload({ order_id: 'ord-1', status: 'success' })).toBeNull();
  });
});

describe('parseFreedomWebhookPayload', () => {
  it('completes on paid with amount_kzt', () => {
    expect(
      parseFreedomWebhookPayload({ order_id: 'ord-2', status: 'paid', amount_kzt: 9900 })
    ).toEqual({
      orderId: 'ord-2',
      action: 'complete',
      paidAmountKzt: 9900,
    });
  });

  it('ignores processing status', () => {
    expect(
      parseFreedomWebhookPayload({ order_id: 'ord-2', status: 'processing', amount_kzt: 9900 })
    ).toEqual({
      orderId: 'ord-2',
      action: 'ignore',
      paidAmountKzt: 9900,
    });
  });
});
