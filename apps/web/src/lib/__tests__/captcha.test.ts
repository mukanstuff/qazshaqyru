import { describe, it, expect } from 'vitest';
import { getCaptchaProvider, isCaptchaConfigured, verifyCaptchaToken, describeCaptchaConfig } from '../captcha';

describe('captcha stub', () => {
  it('defaults to stub provider', () => {
    expect(getCaptchaProvider({})).toBe('stub');
  });

  it('stub passes without token', async () => {
    const result = await verifyCaptchaToken({}, { NODE_ENV: 'development' });
    expect(result).toEqual({ ok: true, provider: 'stub' });
  });

  it('turnstile requires secret and token', async () => {
    expect(isCaptchaConfigured({ CAPTCHA_PROVIDER: 'turnstile' })).toBe(false);
    const result = await verifyCaptchaToken(
      {},
      { CAPTCHA_PROVIDER: 'turnstile', TURNSTILE_SECRET_KEY: 'secret' }
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe('missing_token');
  });

  it('hcaptcha reports not_configured without secret', async () => {
    const result = await verifyCaptchaToken(
      { token: 'abc' },
      { CAPTCHA_PROVIDER: 'hcaptcha' }
    );
    expect(result).toEqual({ ok: false, error: 'not_configured', provider: 'hcaptcha' });
  });
});

describe('describeCaptchaConfig', () => {
  it('flags stub in production as not ready', () => {
    const status = describeCaptchaConfig({ NODE_ENV: 'production', CAPTCHA_PROVIDER: 'stub' });
    expect(status.ready).toBe(false);
    expect(status.provider).toBe('stub');
  });

  it('reports turnstile ready when secret is set', () => {
    const status = describeCaptchaConfig({
      CAPTCHA_PROVIDER: 'turnstile',
      TURNSTILE_SECRET_KEY: 'secret',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
    });
    expect(status.provider).toBe('turnstile');
    expect(status.ready).toBe(true);
  });

  it('reports turnstile not ready without public site key', () => {
    const status = describeCaptchaConfig({
      CAPTCHA_PROVIDER: 'turnstile',
      TURNSTILE_SECRET_KEY: 'secret',
    });
    expect(status.ready).toBe(false);
    expect(status.message).toContain('NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  });
});
