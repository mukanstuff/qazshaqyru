import { describe, it, expect } from 'vitest';
import { getProductionStartupSummary } from '@/lib/shared/production-startup';

describe('getProductionStartupSummary', () => {
  const baseProdEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    APP_URL: 'https://qazshaqyru.kz',
    SMS_PROVIDER: 'kz',
    KZ_SMS_API_KEY: 'sms-key',
    PAYMENT_PROVIDER: 'kaspi',
    KASPI_API_KEY: 'kaspi-key',
    KASPI_WEBHOOK_SECRET: 'webhook-secret-16chars',
    S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    S3_BUCKET: 'QazShaqyru',
    S3_ACCESS_KEY: 'access',
    S3_SECRET_KEY: 'secret',
    S3_PUBLIC_URL: 'https://cdn.qazshaqyru.kz',
  };

  it('reports ready when all services configured', () => {
    const summary = getProductionStartupSummary({
      ...baseProdEnv,
      CAPTCHA_PROVIDER: 'turnstile',
      TURNSTILE_SECRET_KEY: 'turnstile-secret',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site',
    });
    expect(summary.smsReady).toBe(true);
    expect(summary.kaspiWebhookReady).toBe(true);
    expect(summary.kaspiWebhookUrl).toBe('https://qazshaqyru.kz/api/orders/webhook/kaspi');
    expect(summary.uploadMode).toBe('s3');
    expect(summary.captchaReady).toBe(true);
    expect(summary.captchaProvider).toBe('turnstile');
  });

  it('flags missing SMS, local uploads, and stub captcha in production', () => {
    const summary = getProductionStartupSummary({
      NODE_ENV: 'production',
      APP_URL: 'https://qazshaqyru.kz',
      SMS_PROVIDER: 'kz',
      PAYMENT_PROVIDER: 'kaspi',
      KASPI_API_KEY: 'key',
      CAPTCHA_PROVIDER: 'stub',
    });
    expect(summary.smsReady).toBe(false);
    expect(summary.uploadMode).toBe('local');
    expect(summary.kaspiWebhookReady).toBe(false);
    expect(summary.captchaReady).toBe(false);
    expect(summary.captchaProvider).toBe('stub');
  });
});
