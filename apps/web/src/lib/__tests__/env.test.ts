import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnv,
  resetEnvValidationForTests,
  auditProductionEnv,
  hasBlockingEnvErrors,
} from '../env';

describe('validateEnv production rules', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetEnvValidationForTests();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnvValidationForTests();
  });

  const baseProdEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'production' as NodeJS.ProcessEnv['NODE_ENV'],
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    SESSION_SECRET: 'x'.repeat(32),
    APP_URL: 'https://invito.kz',
    TRUST_PROXY: 'true',
    ADMIN_API_KEY: 'a'.repeat(32),
    SMS_PROVIDER: 'kz',
    KZ_SMS_API_KEY: 'sms-key',
    PAYMENT_PROVIDER: 'kaspi',
    KASPI_API_KEY: 'kaspi-key',
    KASPI_WEBHOOK_SECRET: 'webhook-secret-16chars',
    ALLOW_MOCK_PAYMENT: 'false',
    WHATSAPP_NUMBER: '77001234567',
  };

  it('skips validation in test NODE_ENV', () => {
    process.env = { NODE_ENV: 'test', DATABASE_URL: 'postgresql://x' };
    expect(() => validateEnv()).not.toThrow();
  });

  it('skips validation during next production build phase', () => {
    process.env = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://x',
      NEXT_PHASE: 'phase-production-build',
    };
    expect(() => validateEnv()).not.toThrow();
  });

  it('passes with full production Kaspi + KZ SMS config', () => {
    process.env = { ...baseProdEnv };
    expect(() => validateEnv()).not.toThrow();
  });

  it('rejects mock SMS in production', () => {
    process.env = { ...baseProdEnv, SMS_PROVIDER: 'mock' };
    expect(() => validateEnv()).toThrow(/SMS_PROVIDER=mock/);
  });

  it('rejects kaspi without webhook secret in production', () => {
    process.env = { ...baseProdEnv, KASPI_WEBHOOK_SECRET: 'short' };
    expect(() => validateEnv()).toThrow(/KASPI_WEBHOOK_SECRET/);
  });

  it('requires KZ SMS API key when SMS_PROVIDER=kz', () => {
    process.env = { ...baseProdEnv, KZ_SMS_API_KEY: '' };
    expect(() => validateEnv()).toThrow(/KZ_SMS_API_KEY/);
  });

  it('rejects CHANGE_ME placeholder in SESSION_SECRET', () => {
    process.env = { ...baseProdEnv, SESSION_SECRET: 'CHANGE_ME_32_plus_chars_openssl_rand_hex_32' };
    expect(() => validateEnv()).toThrow(/SESSION_SECRET/);
  });
});

describe('auditProductionEnv', () => {
  const baseProdEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    SESSION_SECRET: 'x'.repeat(32),
    APP_URL: 'http://203.0.113.10',
    TRUST_PROXY: 'true',
    ADMIN_API_KEY: 'a'.repeat(32),
    SMS_PROVIDER: 'kz',
    KZ_SMS_API_KEY: 'sms-key',
    PAYMENT_PROVIDER: 'kaspi',
    KASPI_API_KEY: 'kaspi-key',
    KASPI_WEBHOOK_SECRET: 'webhook-secret-16chars',
    ALLOW_MOCK_PAYMENT: 'false',
    WHATSAPP_NUMBER: '77001234567',
  };

  it('warns on HTTP APP_URL for IP-only staging', () => {
    const items = auditProductionEnv(baseProdEnv);
    const appUrl = items.find((i) => i.key === 'APP_URL');
    expect(appUrl?.status).toBe('warn');
    expect(hasBlockingEnvErrors(items)).toBe(false);
  });

  it('errors on partial S3 config', () => {
    const items = auditProductionEnv({
      ...baseProdEnv,
      S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
      S3_BUCKET: 'invito',
    });
    expect(items.some((i) => i.key === 'S3_*' && i.status === 'error')).toBe(true);
  });

  it('ok when full S3 config is present', () => {
    const items = auditProductionEnv({
      ...baseProdEnv,
      S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
      S3_BUCKET: 'invito',
      S3_ACCESS_KEY: 'access',
      S3_SECRET_KEY: 'secret',
      S3_PUBLIC_URL: 'https://cdn.invito.kz',
    });
    expect(items.some((i) => i.key === 'S3_*' && i.status === 'ok')).toBe(true);
  });

  it('warns when WHATSAPP_NUMBER is missing', () => {
    const items = auditProductionEnv({
      ...baseProdEnv,
      WHATSAPP_NUMBER: '',
      NEXT_PUBLIC_WHATSAPP_NUMBER: '',
    });
    expect(items.some((i) => i.key === 'WHATSAPP_NUMBER' && i.status === 'warn')).toBe(true);
  });

  it('warns when ALLOW_MOCK_PAYMENT=true with kaspi provider', () => {
    const items = auditProductionEnv({
      ...baseProdEnv,
      ALLOW_MOCK_PAYMENT: 'true',
    });
    expect(items.some((i) => i.key === 'ALLOW_MOCK_PAYMENT' && i.status === 'warn')).toBe(true);
  });

  it('includes Kaspi webhook URL when kaspi is configured', () => {
    const items = auditProductionEnv(baseProdEnv);
    const webhook = items.find((i) => i.key === 'KASPI_WEBHOOK_URL');
    expect(webhook?.message).toContain('/api/orders/webhook/kaspi');
  });

  it('errors when turnstile secret is set without public site key', () => {
    const items = auditProductionEnv({
      ...baseProdEnv,
      CAPTCHA_PROVIDER: 'turnstile',
      TURNSTILE_SECRET_KEY: 'secret',
      NEXT_PUBLIC_CAPTCHA_PROVIDER: 'turnstile',
    });
    expect(items.some((i) => i.key === 'NEXT_PUBLIC_TURNSTILE_SITE_KEY' && i.status === 'error')).toBe(true);
  });
});
