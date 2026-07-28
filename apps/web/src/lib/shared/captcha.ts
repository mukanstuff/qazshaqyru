/**
 * Captcha verification layer (stub until Turnstile/hCaptcha is wired on public forms).
 * See apps/web/docs/CAPTCHA_SPEC.md for rollout plan.
 */

export type CaptchaProvider = 'stub' | 'turnstile' | 'hcaptcha';

export interface CaptchaVerifyResult {
  ok: boolean;
  error?: string;
  provider: CaptchaProvider;
}

export interface CaptchaVerifyInput {
  token?: string | null;
  remoteIp?: string | null;
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

export function getCaptchaProvider(env: Partial<NodeJS.ProcessEnv> = process.env): CaptchaProvider {
  const raw = env.CAPTCHA_PROVIDER?.trim().toLowerCase();
  if (raw === 'turnstile' || raw === 'hcaptcha') return raw;
  return 'stub';
}

export function isCaptchaConfigured(env: Partial<NodeJS.ProcessEnv> = process.env): boolean {
  const provider = getCaptchaProvider(env);
  if (provider === 'stub') return env.NODE_ENV !== 'production';
  if (provider === 'turnstile') return Boolean(env.TURNSTILE_SECRET_KEY?.trim());
  return Boolean(env.HCAPTCHA_SECRET_KEY?.trim());
}

export interface CaptchaConfigStatus {
  provider: CaptchaProvider;
  ready: boolean;
  message: string;
}

/** Human-readable captcha readiness for startup logs and env audit. */
export function describeCaptchaConfig(env: Partial<NodeJS.ProcessEnv> = process.env): CaptchaConfigStatus {
  const provider = getCaptchaProvider(env);

  if (provider === 'stub') {
    if (env.NODE_ENV === 'production') {
      return {
        provider,
        ready: false,
        message:
          'CAPTCHA_PROVIDER=stub — RSVP/wishes/open-RSVP use honeypot only; set turnstile before public launch',
      };
    }
    return { provider, ready: true, message: 'stub (dev) — honeypot only; token optional' };
  }

  if (!isCaptchaConfigured(env)) {
    const secretKey = provider === 'turnstile' ? 'TURNSTILE_SECRET_KEY' : 'HCAPTCHA_SECRET_KEY';
    return {
      provider,
      ready: false,
      message: `CAPTCHA_PROVIDER=${provider} requires ${secretKey}`,
    };
  }

  const publicSiteKey =
    provider === 'turnstile'
      ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
      : env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim();
  if (!publicSiteKey) {
    const publicKey = provider === 'turnstile' ? 'NEXT_PUBLIC_TURNSTILE_SITE_KEY' : 'NEXT_PUBLIC_HCAPTCHA_SITE_KEY';
    return {
      provider,
      ready: false,
      message: `CAPTCHA_PROVIDER=${provider} requires ${publicKey} for client widget`,
    };
  }

  return { provider, ready: true, message: `${provider} configured` };
}

/**
 * Verify captcha token from client widget.
 * stub: always passes (dev/staging); production should set CAPTCHA_PROVIDER before launch.
 */
export async function verifyCaptchaToken(
  input: CaptchaVerifyInput,
  env: Partial<NodeJS.ProcessEnv> = process.env
): Promise<CaptchaVerifyResult> {
  const provider = getCaptchaProvider(env);

  if (provider === 'stub') {
    if (env.NODE_ENV === 'production') {
      console.warn(
        '[captcha] CAPTCHA_PROVIDER=stub in production — public forms rely on honeypot only until Turnstile/hCaptcha is enabled'
      );
    }
    return { ok: true, provider: 'stub' };
  }

  const token = input.token?.trim();
  if (!token) {
    return { ok: false, error: 'missing_token', provider };
  }

  if (provider === 'turnstile') {
    return verifyProviderToken(TURNSTILE_VERIFY_URL, env.TURNSTILE_SECRET_KEY, token, input.remoteIp, provider);
  }

  return verifyProviderToken(HCAPTCHA_VERIFY_URL, env.HCAPTCHA_SECRET_KEY, token, input.remoteIp, provider);
}

async function verifyProviderToken(
  url: string,
  secret: string | undefined,
  token: string,
  remoteIp: string | null | undefined,
  provider: CaptchaProvider
): Promise<CaptchaVerifyResult> {
  if (!secret?.trim()) {
    return { ok: false, error: 'not_configured', provider };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp?.trim()) {
      body.set('remoteip', remoteIp.trim());
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { ok: false, error: 'verify_http_error', provider };
    }

    const data = (await response.json()) as { success?: boolean };
    if (data.success === true) {
      return { ok: true, provider };
    }
    return { ok: false, error: 'verify_failed', provider };
  } catch {
    return { ok: false, error: 'verify_unreachable', provider };
  }
}
