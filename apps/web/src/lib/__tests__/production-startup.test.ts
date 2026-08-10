import { describe, it, expect } from 'vitest';
import { getProductionStartupSummary } from '@/lib/shared/production-startup';

describe('getProductionStartupSummary', () => {
  const baseProdEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    APP_URL: 'https://qazshaqyru.kz',
    AUTH_WHATSAPP_ENABLED: 'true',
    WHATSAPP_PHONE_NUMBER_ID: '123456789',
    WHATSAPP_ACCESS_TOKEN: 'wa-token',
    WHATSAPP_AUTH_TEMPLATE_NAME: 'AUTH_CODE',
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
    expect(summary.whatsappOtpReady).toBe(true);
    expect(summary.kaspiWebhookReady).toBe(true);
    expect(summary.kaspiWebhookUrl).toBe('https://qazshaqyru.kz/api/orders/webhook/kaspi');
    expect(summary.uploadMode).toBe('s3');
    expect(summary.captchaReady).toBe(true);
    expect(summary.captchaProvider).toBe('turnstile');
  });

  it('flags missing WhatsApp OTP, local uploads, and stub captcha in production', () => {
    const summary = getProductionStartupSummary({
      NODE_ENV: 'production',
      APP_URL: 'https://qazshaqyru.kz',
      PAYMENT_PROVIDER: 'kaspi',
      KASPI_API_KEY: 'key',
      CAPTCHA_PROVIDER: 'stub',
    });
    expect(summary.whatsappOtpReady).toBe(false);
    expect(summary.uploadMode).toBe('local');
    expect(summary.kaspiWebhookReady).toBe(false);
    expect(summary.captchaReady).toBe(false);
    expect(summary.captchaProvider).toBe('stub');
  });
});