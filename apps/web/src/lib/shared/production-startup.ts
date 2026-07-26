import { describeCaptchaConfig } from '@/lib/shared/captcha';
import { getKaspiWebhookUrl, isKaspiWebhookReady } from '@/lib/payments/payment-provider-config';
import { describeUploadStorage } from '@/lib/uploads/upload-storage';
import { formatSmsConfigError, isSmsProviderReady } from '@/lib/shared/sms';

export interface ProductionStartupSummary {
  smsReady: boolean;
  smsMessage: string;
  kaspiWebhookReady: boolean;
  kaspiWebhookUrl: string | null;
  uploadMode: 'local' | 's3';
  uploadMessage: string;
  captchaReady: boolean;
  captchaMessage: string;
  captchaProvider: string;
}

export function getProductionStartupSummary(env: NodeJS.ProcessEnv = process.env): ProductionStartupSummary {
  const upload = describeUploadStorage(env);
  const appUrl = env.APP_URL?.trim();
  const captcha = describeCaptchaConfig(env);

  return {
    smsReady: isSmsProviderReady(env),
    smsMessage: formatSmsConfigError(env),
    kaspiWebhookReady: isKaspiWebhookReady(env),
    kaspiWebhookUrl: appUrl ? getKaspiWebhookUrl(appUrl) : null,
    uploadMode: upload.mode,
    uploadMessage: upload.message,
    captchaReady: captcha.ready,
    captchaMessage: captcha.message,
    captchaProvider: captcha.provider,
  };
}

/** Logs non-blocking production hints after validateEnv() passes. */
export function logProductionStartupSummary(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  const summary = getProductionStartupSummary(env);

  console.log('[startup] Production services:');
  console.log(`[startup]   SMS: ${summary.smsReady ? 'ready' : 'NOT READY'} — ${summary.smsMessage}`);

  if (env.PAYMENT_PROVIDER === 'kaspi' || env.KASPI_API_KEY) {
    if (summary.kaspiWebhookUrl) {
      console.log(`[startup]   Kaspi webhook URL (register in Kaspi Business): ${summary.kaspiWebhookUrl}`);
    }
    if (!summary.kaspiWebhookReady) {
      console.warn(
        '[startup]   Kaspi webhook: KASPI_WEBHOOK_SECRET not set — POST /api/orders/webhook/kaspi will reject callbacks'
      );
    }
  }

  console.log(`[startup]   Uploads: ${summary.uploadMode} — ${summary.uploadMessage}`);
  console.log(
    `[startup]   Captcha (${summary.captchaProvider}): ${summary.captchaReady ? 'ready' : 'NOT READY'} — ${summary.captchaMessage}`
  );
}
