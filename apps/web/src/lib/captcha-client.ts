/**
 * Client-side captcha config (NEXT_PUBLIC_* only).
 * Server verification uses CAPTCHA_PROVIDER + secret keys in lib/captcha.ts.
 */

export type ClientCaptchaProvider = 'stub' | 'turnstile' | 'hcaptcha';

export function getClientCaptchaProvider(): ClientCaptchaProvider {
  const raw = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER?.trim().toLowerCase();
  if (raw === 'turnstile' || raw === 'hcaptcha') return raw;
  return 'stub';
}

export function getClientCaptchaSiteKey(): string | undefined {
  const provider = getClientCaptchaProvider();
  if (provider === 'turnstile') {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
  }
  if (provider === 'hcaptcha') {
    return process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim() || undefined;
  }
  return undefined;
}

/** True when a captcha widget must render and token is required before submit. */
export function isCaptchaRequiredOnClient(): boolean {
  return Boolean(getClientCaptchaSiteKey());
}
