#!/usr/bin/env tsx
/**
 * Pre-deploy production environment checklist.
 *
 * Usage (from repo root):
 *   set -a && source .env && set +a && cd apps/web && pnpm check:env
 *
 * Or with explicit env file:
 *   pnpm check:env -- --env-file ../../.env
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditProductionEnv, hasBlockingEnvErrors, type EnvCheckItem } from '../src/lib/shared/env';
import { getProductionStartupSummary } from '../src/lib/shared/production-startup';
import { getKaspiWebhookUrl } from '../src/lib/payments/payment-provider-config';

function loadEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function parseArgs(argv: string[]): { envFile?: string } {
  const envFileIdx = argv.indexOf('--env-file');
  if (envFileIdx !== -1 && argv[envFileIdx + 1]) {
    return { envFile: argv[envFileIdx + 1] };
  }
  return {};
}

function statusIcon(status: EnvCheckItem['status']): string {
  switch (status) {
    case 'ok':
      return '✓';
    case 'warn':
      return '⚠';
    case 'error':
      return '✗';
  }
}

function main(): void {
  const { envFile } = parseArgs(process.argv.slice(2));
  const candidates = [
    envFile ? resolve(envFile) : null,
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ].filter((p): p is string => Boolean(p));

  const file = candidates.find((p) => existsSync(p));
  const fileVars = file ? loadEnvFile(file) : {};

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...fileVars,
    NODE_ENV: (fileVars.NODE_ENV || process.env.NODE_ENV || 'production') as NodeJS.ProcessEnv['NODE_ENV'],
  };

  if (file) {
    console.log(`[check-env] Loaded: ${file}`);
  } else {
    console.log('[check-env] No .env file found — using process environment only');
  }

  console.log(`[check-env] NODE_ENV=${env.NODE_ENV}`);
  console.log('');

  const items = auditProductionEnv(env);
  for (const item of items) {
    console.log(`  ${statusIcon(item.status)} ${item.key}: ${item.message}`);
  }

  const errors = items.filter((i) => i.status === 'error').length;
  const warnings = items.filter((i) => i.status === 'warn').length;
  const ok = items.filter((i) => i.status === 'ok').length;

  console.log('');
  console.log(`[check-env] ${ok} ok, ${warnings} warnings, ${errors} errors`);

  const appUrl = env.APP_URL?.trim();
  if (appUrl && (env.PAYMENT_PROVIDER === 'kaspi' || env.KASPI_API_KEY)) {
    console.log('');
    console.log('[check-env] Kaspi webhook (register in business.kaspi.kz):');
    console.log(`  URL:    POST ${getKaspiWebhookUrl(appUrl)}`);
    console.log('  Header: x-kaspi-signature (HMAC-SHA256 of body with KASPI_WEBHOOK_SECRET)');
  }

  const summary = getProductionStartupSummary(env);
  console.log('');
  console.log('[check-env] Runtime summary:');
  console.log(`  WhatsApp OTP: ${summary.whatsappOtpReady ? 'ready' : 'NOT READY'} — ${summary.whatsappOtpMessage}`);
  console.log(`  Uploads: ${summary.uploadMode} — ${summary.uploadMessage}`);

  if (env.NODE_ENV === 'production') {
    console.log('');
    console.log('[check-env] You must provide before public launch:');
    const gaps: string[] = [];
    if (!summary.whatsappOtpReady && env.AUTH_WHATSAPP_ENABLED === 'true') {
      gaps.push('WhatsApp Cloud API credentials (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN / template)');
    }
    if (!env.GOOGLE_CLIENT_ID?.trim() || !env.GOOGLE_CLIENT_SECRET?.trim()) {
      gaps.push('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) — see docs/google-oauth-setup.md');
    }
    if (env.PAYMENT_PROVIDER === 'kaspi' && !env.KASPI_API_KEY?.trim()) {
      gaps.push('KASPI_API_KEY from Kaspi Business');
    }
    if ((env.PAYMENT_PROVIDER === 'kaspi' || env.KASPI_API_KEY) && !summary.kaspiWebhookReady) {
      gaps.push('KASPI_WEBHOOK_SECRET + webhook URL in Kaspi dashboard');
    }
    if (summary.uploadMode === 'local') {
      gaps.push('S3/R2 credentials (recommended) or accept Docker volume uploads');
    }
    if (!summary.captchaReady) {
      gaps.push('CAPTCHA_PROVIDER=turnstile + TURNSTILE_* keys (see docs/CAPTCHA_SPEC.md)');
    }
    if (appUrl && !appUrl.startsWith('https://')) {
      gaps.push('Domain + DNS A record → switch APP_URL to https://');
    }
    if (gaps.length === 0) {
      console.log('  (none — env looks ready for launch)');
    } else {
      for (const gap of gaps) {
        console.log(`  • ${gap}`);
      }
    }
  }

  if (hasBlockingEnvErrors(items)) {
    console.error('[check-env] Fix errors before deploying to production.');
    process.exit(1);
  }

  if (warnings > 0) {
    console.log('[check-env] Warnings are OK for staging; resolve before public launch.');
  } else {
    console.log('[check-env] All checks passed.');
  }
}

main();
