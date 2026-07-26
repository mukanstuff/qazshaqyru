import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isMockPaymentAllowed, assertMockPaymentAllowed } from '@/lib/payments/mock-payment-guard';

describe('mock-payment-guard', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows mock only in development with ALLOW_MOCK_PAYMENT=true', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development', ALLOW_MOCK_PAYMENT: 'true' };
    expect(isMockPaymentAllowed()).toBe(true);
  });

  it('blocks mock in production even with ALLOW_MOCK_PAYMENT=true', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production', ALLOW_MOCK_PAYMENT: 'true' };
    expect(isMockPaymentAllowed()).toBe(false);
  });

  it('assertMockPaymentAllowed throws when disabled', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    expect(() => assertMockPaymentAllowed()).toThrow('Mock payment is disabled');
  });
});
