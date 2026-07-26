import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getConfiguredPaymentProvider,
  getKaspiMissingConfigKeys,
  formatKaspiConfigError,
  isPaymentProviderReady,
  resolveCheckoutProvider,
  getKaspiWebhookUrl,
  isKaspiWebhookReady,
} from '@/lib/payments/payment-provider-config';
import { ApiError } from '@/lib/shared/api';

describe('payment-provider-config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects kaspi from PAYMENT_PROVIDER env', () => {
    process.env.PAYMENT_PROVIDER = 'kaspi';
    expect(getConfiguredPaymentProvider()).toBe('kaspi');
  });

  it('falls back to kaspi when KASPI_API_KEY is set', () => {
    delete process.env.PAYMENT_PROVIDER;
    process.env.KASPI_API_KEY = 'key-123';
    expect(getConfiguredPaymentProvider()).toBe('kaspi');
  });

  it('reports missing Kaspi keys', () => {
    delete process.env.KASPI_API_KEY;
    delete process.env.KASPI_WEBHOOK_SECRET;
    expect(getKaspiMissingConfigKeys()).toEqual(['KASPI_API_KEY', 'KASPI_WEBHOOK_SECRET']);
    expect(formatKaspiConfigError()).toContain('KASPI_API_KEY');
    expect(formatKaspiConfigError()).toContain('business.kaspi.kz');
  });

  it('kaspi is not ready without API key', () => {
    delete process.env.KASPI_API_KEY;
    expect(isPaymentProviderReady('kaspi')).toBe(false);
  });

  it('resolveCheckoutProvider throws clear error for kaspi without keys in dev', () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'development' as NodeJS.ProcessEnv['NODE_ENV'],
      ALLOW_MOCK_PAYMENT: 'true',
      PAYMENT_PROVIDER: 'kaspi',
    };
    delete process.env.KASPI_API_KEY;

    try {
      resolveCheckoutProvider('kaspi');
      expect.fail('expected ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe('payment_not_configured');
      expect(apiErr.message).toContain('KASPI_API_KEY');
    }
  });

  it('resolveCheckoutProvider uses mock in dev when no provider requested', () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'development' as NodeJS.ProcessEnv['NODE_ENV'],
      ALLOW_MOCK_PAYMENT: 'true',
    };
    expect(resolveCheckoutProvider()).toBe('mock');
  });

  it('resolveCheckoutProvider blocks production without configured provider', () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production' as NodeJS.ProcessEnv['NODE_ENV'],
    };
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.KASPI_API_KEY;

    expect(() => resolveCheckoutProvider()).toThrow(ApiError);
  });

  it('getKaspiWebhookUrl builds endpoint from APP_URL', () => {
    expect(getKaspiWebhookUrl('https://qazshaqyru.kz/')).toBe(
      'https://qazshaqyru.kz/api/orders/webhook/kaspi'
    );
  });

  it('isKaspiWebhookReady rejects placeholder secret', () => {
    expect(
      isKaspiWebhookReady({
        NODE_ENV: 'test',
        KASPI_WEBHOOK_SECRET: 'CHANGE_ME_generate_with_openssl_rand_hex_32',
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });
});
