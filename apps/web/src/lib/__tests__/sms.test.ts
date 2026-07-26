import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSmsProviderName,
  getKzSmsMissingCredentials,
  resetSmsProviderCacheForTests,
  formatSmsConfigError,
  isSmsProviderReady,
} from '@/lib/shared/sms';

describe('sms provider selection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetSmsProviderCacheForTests();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetSmsProviderCacheForTests();
  });

  it('defaults to mock', () => {
    delete process.env.SMS_PROVIDER;
    expect(getSmsProviderName()).toBe('mock');
  });

  it('selects kz provider', () => {
    process.env.SMS_PROVIDER = 'kz';
    expect(getSmsProviderName()).toBe('kz');
  });

  it('reports missing KZ credentials', () => {
    delete process.env.KZ_SMS_API_KEY;
    expect(getKzSmsMissingCredentials()).toEqual(['KZ_SMS_API_KEY']);
  });

  it('KZ provider returns false when API key missing', async () => {
    process.env.SMS_PROVIDER = 'kz';
    delete process.env.KZ_SMS_API_KEY;
    const { getSMSProvider } = await import('@/lib/shared/sms');
    const ok = await getSMSProvider().send('+77001234567', 'test');
    expect(ok).toBe(false);
  });

  it('formatSmsConfigError lists missing KZ key', () => {
    process.env.SMS_PROVIDER = 'kz';
    delete process.env.KZ_SMS_API_KEY;
    expect(formatSmsConfigError()).toContain('KZ_SMS_API_KEY');
  });

  it('isSmsProviderReady is false in production with mock', () => {
    expect(isSmsProviderReady({ NODE_ENV: 'production', SMS_PROVIDER: 'mock' })).toBe(false);
  });
});
