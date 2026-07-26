import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PUBLICATION_PRICE_KZT,
  PUBLICATION_PRICE_MAX_KZT,
  PUBLICATION_PRICE_MIN_KZT,
  resolvePublicationPriceKzt,
} from '@/lib/invitations/invitation-pricing';

describe('freemium publication pricing', () => {
  it('uses default 3990 KZT when template price is 0', () => {
    expect(resolvePublicationPriceKzt(0)).toBe(DEFAULT_PUBLICATION_PRICE_KZT);
    expect(resolvePublicationPriceKzt(null)).toBe(DEFAULT_PUBLICATION_PRICE_KZT);
    expect(resolvePublicationPriceKzt(undefined)).toBe(DEFAULT_PUBLICATION_PRICE_KZT);
  });

  it('clamps legacy template prices into publication range', () => {
    expect(resolvePublicationPriceKzt(9900)).toBe(PUBLICATION_PRICE_MAX_KZT);
    expect(resolvePublicationPriceKzt(1500)).toBe(PUBLICATION_PRICE_MIN_KZT);
    expect(resolvePublicationPriceKzt(3990)).toBe(3990);
  });

  it('never treats publication as free', () => {
    expect(resolvePublicationPriceKzt(0)).toBeGreaterThan(0);
    expect(DEFAULT_PUBLICATION_PRICE_KZT).toBe(3990);
  });
});

describe('checkout mock payment URL', () => {
  it('builds mock payment URL with order id and token', () => {
    const baseUrl = 'https://example.com';
    const orderId = 'order-1';
    const paymentId = 'pay-1';
    const url = `${baseUrl}/mock-payment?orderId=${orderId}&token=${paymentId}`;
    expect(url).toContain('orderId=order-1');
    expect(url).toContain('token=pay-1');
  });
});
