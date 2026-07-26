import { describe, it, expect, beforeEach } from 'vitest';
import {
  getClientCaptchaProvider,
  getClientCaptchaSiteKey,
  isCaptchaRequiredOnClient,
} from '@/lib/shared/captcha-client';

describe('captcha-client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  });

  it('defaults to stub when NEXT_PUBLIC_CAPTCHA_PROVIDER is unset', () => {
    expect(getClientCaptchaProvider()).toBe('stub');
    expect(isCaptchaRequiredOnClient()).toBe(false);
  });

  it('requires captcha when turnstile site key is set', () => {
    process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER = 'turnstile';
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key';
    expect(isCaptchaRequiredOnClient()).toBe(true);
    expect(getClientCaptchaSiteKey()).toBe('site-key');
  });

  it('does not require captcha when turnstile provider lacks site key', () => {
    process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER = 'turnstile';
    expect(isCaptchaRequiredOnClient()).toBe(false);
  });
});
