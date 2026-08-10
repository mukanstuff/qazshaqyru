import { z } from 'zod';
import { describeUploadStorage } from '@/lib/uploads/upload-storage';
import { validateS3UrlSeparation } from '@/lib/uploads/s3';
import { getKaspiWebhookUrl, isKaspiWebhookReady } from '@/lib/payments/payment-provider-config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().optional(),
  APP_URL: z.string().url().optional(),
  TRUST_PROXY: z.enum(['true', 'false']).optional(),
  OTP_EXPIRY_MINUTES: z.string().optional(),
  OTP_MAX_ATTEMPTS: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_AUTH_TEMPLATE_NAME: z.string().optional(),
  WHATSAPP_AUTH_TEMPLATE_LANGUAGE: z.string().optional(),
  AUTH_WHATSAPP_ENABLED: z.enum(['true', 'false']).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  KASPI_API_KEY: z.string().optional(),
  KASPI_API_URL: z.string().url().optional(),
  KASPI_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(['mock', 'kaspi', 'freedom']).optional(),
  FREEDOM_API_KEY: z.string().optional(),
  FREEDOM_API_URL: z.string().url().optional(),
  FREEDOM_WEBHOOK_SECRET: z.string().optional(),
  FREEDOM_PAY_ENABLED: z.enum(['true', 'false']).optional(),
  ALLOW_MOCK_PAYMENT: z.enum(['true', 'false']).optional(),
  ADMIN_API_KEY: z.string().optional(),
  ADMIN_PHONE: z.string().optional(),
  WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),
  UPLOAD_DISK_QUOTA_MB: z.string().optional(),
  CAPTCHA_PROVIDER: z.enum(['stub', 'turnstile', 'hcaptcha']).optional(),
  TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SITE_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
});

export type EnvCheckStatus = 'ok' | 'warn' | 'error';

export interface EnvCheckItem {
  key: string;
  status: EnvCheckStatus;
  message: string;
}

/** Canonical production apex host (no www, no trailing path). */
export const CANONICAL_PROD_HOST = 'qazshaqyru.kz';

/** Obsolete / wrong brand domains — must never ship as production APP_URL. */
export const FORBIDDEN_PROD_HOSTS = ['invito.kz', 'www.invito.kz'] as const;

const S3_KEYS = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_PUBLIC_URL'] as const;

function isIpHostname(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname === 'localhost' || hostname === '127.0.0.1';
}

/** True when APP_URL host is a forbidden obsolete brand domain. */
export function isForbiddenBrandHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return (FORBIDDEN_PROD_HOSTS as readonly string[]).includes(host);
}

let validated = false;

function envValue(env: NodeJS.ProcessEnv, key: string): string | undefined {
  return env[key]?.trim() || undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return value.startsWith('CHANGE_ME');
}

function resolvePaymentProvider(env: NodeJS.ProcessEnv): string | null {
  return env.PAYMENT_PROVIDER ?? (env.KASPI_API_KEY ? 'kaspi' : null);
}

function warnPartialS3Config(env: NodeJS.ProcessEnv = process.env): void {
  const set = S3_KEYS.filter((k) => Boolean(envValue(env, k)));
  if (set.length > 0 && set.length < S3_KEYS.length) {
    const missing = S3_KEYS.filter((k) => !envValue(env, k));
    console.warn(
      `[env] WARNING: Partial S3 config — set all of ${S3_KEYS.join(', ')} or none. Missing: ${missing.join(', ')}`
    );
  }
}

function pushCheck(
  items: EnvCheckItem[],
  key: string,
  status: EnvCheckStatus,
  message: string
): void {
  items.push({ key, status, message });
}

/**
 * Non-throwing production readiness checklist (CLI / pre-deploy).
 * Set NODE_ENV=production in env for production rules.
 */
export function auditProductionEnv(env: NodeJS.ProcessEnv = process.env): EnvCheckItem[] {
  const items: EnvCheckItem[] = [];
  const isProd = env.NODE_ENV === 'production';

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      pushCheck(items, issue.path.join('.') || 'env', 'error', issue.message);
    }
    return items;
  }

  if (!envValue(env, 'DATABASE_URL')) {
    pushCheck(items, 'DATABASE_URL', 'error', 'DATABASE_URL is required');
  } else if (isPlaceholder(envValue(env, 'DATABASE_URL'))) {
    pushCheck(items, 'DATABASE_URL', 'error', 'Replace CHANGE_ME placeholder in DATABASE_URL');
  } else {
    pushCheck(items, 'DATABASE_URL', 'ok', 'Database URL is set');
  }

  if (!isProd) {
    pushCheck(items, 'NODE_ENV', 'warn', 'NODE_ENV is not production — audit uses production rules when NODE_ENV=production');
    return items;
  }

  const secret = envValue(env, 'SESSION_SECRET');
  if (!secret || secret.length < 32) {
    pushCheck(items, 'SESSION_SECRET', 'error', 'SESSION_SECRET must be at least 32 characters (openssl rand -hex 32)');
  } else if (isPlaceholder(secret)) {
    pushCheck(items, 'SESSION_SECRET', 'error', 'Replace CHANGE_ME placeholder in SESSION_SECRET');
  } else {
    pushCheck(items, 'SESSION_SECRET', 'ok', 'SESSION_SECRET length OK');
  }

  const appUrl = envValue(env, 'APP_URL');
  if (!appUrl) {
    pushCheck(
      items,
      'APP_URL',
      'error',
      `APP_URL is required (https://${CANONICAL_PROD_HOST} or http://VPS_IP before domain)`
    );
  } else {
    try {
      const url = new URL(appUrl);
      if (url.pathname !== '/' && url.pathname !== '') {
        pushCheck(items, 'APP_URL', 'error', 'APP_URL must have no path (no trailing slash path)');
      } else if (isForbiddenBrandHost(url.hostname)) {
        pushCheck(
          items,
          'APP_URL',
          'error',
          `APP_URL uses obsolete brand domain "${url.hostname}". Use https://${CANONICAL_PROD_HOST}`
        );
      } else if (url.protocol === 'http:') {
        pushCheck(
          items,
          'APP_URL',
          'warn',
          'APP_URL uses HTTP — OK for IP-only testing; switch to https:// after domain + DNS'
        );
      } else if (
        url.protocol === 'https:' &&
        !isIpHostname(url.hostname) &&
        url.hostname.replace(/^www\./, '') !== CANONICAL_PROD_HOST
      ) {
        pushCheck(
          items,
          'APP_URL',
          'warn',
          `APP_URL host is ${url.hostname}; canonical brand domain is ${CANONICAL_PROD_HOST}`
        );
      } else {
        pushCheck(items, 'APP_URL', 'ok', `APP_URL is ${appUrl.replace(/\/$/, '')}`);
      }
    } catch {
      pushCheck(items, 'APP_URL', 'error', 'APP_URL must be a valid URL');
    }
  }

  if (env.TRUST_PROXY !== 'true') {
    pushCheck(items, 'TRUST_PROXY', 'error', 'TRUST_PROXY must be "true" behind Caddy/nginx on VPS');
  } else {
    pushCheck(items, 'TRUST_PROXY', 'ok', 'TRUST_PROXY=true');
  }

  const adminKey = envValue(env, 'ADMIN_API_KEY');
  if (!adminKey || adminKey.length < 32) {
    pushCheck(items, 'ADMIN_API_KEY', 'error', 'ADMIN_API_KEY must be at least 32 characters');
  } else if (isPlaceholder(adminKey)) {
    pushCheck(items, 'ADMIN_API_KEY', 'error', 'Replace CHANGE_ME placeholder in ADMIN_API_KEY');
  } else {
    pushCheck(items, 'ADMIN_API_KEY', 'ok', 'ADMIN_API_KEY length OK');
  }

  if (env.AUTH_WHATSAPP_ENABLED === 'true') {
    const missing = ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_AUTH_TEMPLATE_NAME'].filter(
      (k) => !envValue(env, k)
    );
    if (missing.length > 0) {
      pushCheck(items, 'AUTH_WHATSAPP_ENABLED', 'error', `WhatsApp OTP enabled but missing: ${missing.join(', ')}`);
    } else {
      pushCheck(items, 'AUTH_WHATSAPP_ENABLED', 'ok', 'WhatsApp OTP configured');
    }
  } else {
    pushCheck(items, 'AUTH_WHATSAPP_ENABLED', 'warn', 'AUTH_WHATSAPP_ENABLED != true — phone login disabled; users must use Google');
  }

  const googleId = envValue(env, 'GOOGLE_CLIENT_ID');
  const googleSecret = envValue(env, 'GOOGLE_CLIENT_SECRET');
  const googleRedirect = envValue(env, 'GOOGLE_REDIRECT_URI');
  if (!googleId || !googleSecret || !googleRedirect) {
    pushCheck(
      items,
      'GOOGLE_OAUTH',
      'error',
      'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI are required — see docs/google-oauth-setup.md'
    );
  } else {
    pushCheck(items, 'GOOGLE_OAUTH', 'ok', `Google OAuth redirect: ${googleRedirect}`);
  }

  const paymentProvider = resolvePaymentProvider(env);
  if (!paymentProvider) {
    pushCheck(
      items,
      'PAYMENT_PROVIDER',
      'warn',
      'PAYMENT_PROVIDER not set — only free templates can be published until Kaspi is configured'
    );
  } else if (paymentProvider === 'kaspi') {
    if (!envValue(env, 'KASPI_API_KEY')) {
      pushCheck(items, 'KASPI_API_KEY', 'error', 'PAYMENT_PROVIDER=kaspi requires KASPI_API_KEY');
    } else {
      pushCheck(items, 'KASPI_API_KEY', 'ok', 'Kaspi API key is set');
    }
    const webhook = envValue(env, 'KASPI_WEBHOOK_SECRET');
    if (!webhook || webhook.length < 16) {
      pushCheck(items, 'KASPI_WEBHOOK_SECRET', 'error', 'KASPI_WEBHOOK_SECRET must be at least 16 characters');
    } else if (isPlaceholder(webhook)) {
      pushCheck(items, 'KASPI_WEBHOOK_SECRET', 'error', 'Replace CHANGE_ME placeholder in KASPI_WEBHOOK_SECRET');
    } else {
      pushCheck(items, 'KASPI_WEBHOOK_SECRET', 'ok', 'Kaspi webhook secret OK');
    }
    const webhookUrl = appUrl ? getKaspiWebhookUrl(appUrl) : null;
    if (webhookUrl) {
      pushCheck(
        items,
        'KASPI_WEBHOOK_URL',
        isKaspiWebhookReady(env) ? 'ok' : 'warn',
        `Register in Kaspi Business: POST ${webhookUrl} (header: x-kaspi-signature)`
      );
    }
  } else if (paymentProvider === 'mock') {
    if (env.ALLOW_MOCK_PAYMENT !== 'true') {
      pushCheck(
        items,
        'PAYMENT_PROVIDER',
        'error',
        'PAYMENT_PROVIDER=mock requires ALLOW_MOCK_PAYMENT=true (staging only)'
      );
    } else {
      pushCheck(items, 'PAYMENT_PROVIDER', 'warn', 'Mock payment enabled — staging only, not for real launch');
    }
  }

  if (env.ALLOW_MOCK_PAYMENT === 'true' && paymentProvider !== 'mock') {
    pushCheck(
      items,
      'ALLOW_MOCK_PAYMENT',
      'warn',
      'ALLOW_MOCK_PAYMENT=true in production — disable before public launch'
    );
  } else if (env.ALLOW_MOCK_PAYMENT !== 'false' && env.ALLOW_MOCK_PAYMENT !== undefined) {
    pushCheck(items, 'ALLOW_MOCK_PAYMENT', 'ok', `ALLOW_MOCK_PAYMENT=${env.ALLOW_MOCK_PAYMENT}`);
  } else {
    pushCheck(items, 'ALLOW_MOCK_PAYMENT', 'ok', 'ALLOW_MOCK_PAYMENT=false (recommended)');
  }

  const s3Set = S3_KEYS.filter((k) => Boolean(envValue(env, k)));
  const uploadStatus = describeUploadStorage(env);
  if (s3Set.length === 0) {
    pushCheck(items, 'S3_*', 'warn', uploadStatus.message);
  } else if (s3Set.length < S3_KEYS.length) {
    const missing = S3_KEYS.filter((k) => !envValue(env, k));
    pushCheck(items, 'S3_*', 'error', `Partial S3 config — missing: ${missing.join(', ')}`);
  } else {
    const publicUrl = envValue(env, 'S3_PUBLIC_URL');
    const urlSeparation = validateS3UrlSeparation(env);
    if (urlSeparation) {
      pushCheck(items, 'S3_PUBLIC_URL', 'error', urlSeparation);
    } else if (publicUrl && !publicUrl.startsWith('https://')) {
      pushCheck(items, 'S3_PUBLIC_URL', 'warn', 'S3_PUBLIC_URL should use HTTPS in production');
    } else {
      pushCheck(items, 'S3_*', 'ok', uploadStatus.message);
    }
  }

  const whatsapp = envValue(env, 'WHATSAPP_NUMBER') ?? envValue(env, 'NEXT_PUBLIC_WHATSAPP_NUMBER');
  if (!whatsapp) {
    pushCheck(
      items,
      'WHATSAPP_NUMBER',
      'warn',
      'WHATSAPP_NUMBER not set — landing CTA and support links will be incomplete'
    );
  } else if (!/^\d{10,15}$/.test(whatsapp.replace(/\D/g, ''))) {
    pushCheck(items, 'WHATSAPP_NUMBER', 'warn', 'WHATSAPP_NUMBER should be digits only (e.g. 77001234567)');
  } else {
    pushCheck(items, 'WHATSAPP_NUMBER', 'ok', `WhatsApp contact: ${whatsapp}`);
  }

  const captchaProvider = env.CAPTCHA_PROVIDER ?? 'stub';
  if (captchaProvider === 'stub') {
    pushCheck(
      items,
      'CAPTCHA_PROVIDER',
      'warn',
      'CAPTCHA_PROVIDER=stub — RSVP/wishes use honeypot only; enable Turnstile before public launch (docs/CAPTCHA_SPEC.md)'
    );
  } else if (captchaProvider === 'turnstile' && !envValue(env, 'TURNSTILE_SECRET_KEY')) {
    pushCheck(items, 'CAPTCHA_PROVIDER', 'error', 'CAPTCHA_PROVIDER=turnstile requires TURNSTILE_SECRET_KEY');
  } else if (captchaProvider === 'turnstile' && !envValue(env, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY')) {
    pushCheck(
      items,
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'error',
      'CAPTCHA_PROVIDER=turnstile requires NEXT_PUBLIC_TURNSTILE_SITE_KEY (client widget)'
    );
  } else if (captchaProvider === 'hcaptcha' && !envValue(env, 'HCAPTCHA_SECRET_KEY')) {
    pushCheck(items, 'CAPTCHA_PROVIDER', 'error', 'CAPTCHA_PROVIDER=hcaptcha requires HCAPTCHA_SECRET_KEY');
  } else if (captchaProvider === 'hcaptcha' && !envValue(env, 'NEXT_PUBLIC_HCAPTCHA_SITE_KEY')) {
    pushCheck(
      items,
      'NEXT_PUBLIC_HCAPTCHA_SITE_KEY',
      'error',
      'CAPTCHA_PROVIDER=hcaptcha requires NEXT_PUBLIC_HCAPTCHA_SITE_KEY (client widget)'
    );
  } else {
    pushCheck(items, 'CAPTCHA_PROVIDER', 'ok', `Captcha provider: ${captchaProvider}`);
  }

  const pgPass = envValue(env, 'POSTGRES_PASSWORD');
  if (pgPass && isPlaceholder(pgPass)) {
    pushCheck(items, 'POSTGRES_PASSWORD', 'error', 'Replace CHANGE_ME placeholder in POSTGRES_PASSWORD');
  }

  return items;
}

export function hasBlockingEnvErrors(items: EnvCheckItem[]): boolean {
  return items.some((item) => item.status === 'error');
}

/**
 * Validates required environment variables at application startup.
 * In production, SESSION_SECRET and APP_URL are mandatory.
 */
export function validateEnv(): void {
  if (validated) return;
  if (process.env.NODE_ENV === 'test') {
    validated = true;
    return;
  }
  // next build compiles instrumentation but must not block on production env audit
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    validated = true;
    return;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[env] Invalid environment: ${msg}`);
  }

  warnPartialS3Config();

  const isProd = parsed.data.NODE_ENV === 'production';

  if (isProd) {
    const audit = auditProductionEnv(process.env);
    const blocking = audit.filter((item) => item.status === 'error');
    if (blocking.length > 0) {
      const msg = blocking.map((item) => `${item.key}: ${item.message}`).join('; ');
      throw new Error(`[env] Production environment check failed: ${msg}`);
    }

    for (const item of audit.filter((item) => item.status === 'warn')) {
      console.warn(`[env] WARNING: ${item.key}: ${item.message}`);
    }

    const otpMax = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
    if (process.env.OTP_MAX_ATTEMPTS && (!Number.isFinite(otpMax) || otpMax < 1 || otpMax > 10)) {
      console.warn('[env] WARNING: OTP_MAX_ATTEMPTS must be 1–10; using default 3.');
    }
  }

  validated = true;
}

/** @internal tests only */
export function resetEnvValidationForTests(): void {
  validated = false;
}

/** OTP verify attempts per code (1–10, default 3). */
export function getOtpMaxAttempts(): number {
  const raw = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
  if (!Number.isFinite(raw) || raw < 1 || raw > 10) return 3;
  return Math.floor(raw);
}
