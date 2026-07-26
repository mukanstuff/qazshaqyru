import { ApiError } from '@/lib/shared/api';

export type PaymentProviderName = 'mock' | 'kaspi' | 'freedom';

const KASPI_DOCS_URL = 'https://business.kaspi.kz';

/**
 * Active provider from env. Kaspi/Freedom are chosen later — until then only mock (dev) works.
 */
export function getConfiguredPaymentProvider(): PaymentProviderName | null {
  const env = process.env.PAYMENT_PROVIDER;
  if (env === 'mock' || env === 'kaspi' || env === 'freedom') {
    return env;
  }
  if (process.env.KASPI_API_KEY) {
    return 'kaspi';
  }
  return null;
}

export function getKaspiMissingConfigKeys(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing: string[] = [];
  if (!env.KASPI_API_KEY?.trim()) missing.push('KASPI_API_KEY');
  if (!env.KASPI_WEBHOOK_SECRET?.trim()) missing.push('KASPI_WEBHOOK_SECRET');
  return missing;
}

export function isKaspiWebhookReady(env: NodeJS.ProcessEnv = process.env): boolean {
  const secret = env.KASPI_WEBHOOK_SECRET?.trim();
  return Boolean(secret && secret.length >= 16 && !secret.startsWith('CHANGE_ME'));
}

/** Public webhook endpoint to register in Kaspi Business dashboard. */
export function getKaspiWebhookUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, '')}/api/orders/webhook/kaspi`;
}

export function formatKaspiConfigError(env: NodeJS.ProcessEnv = process.env): string {
  const missing = getKaspiMissingConfigKeys(env);
  if (missing.length === 0) {
    return 'Kaspi Pay не настроен. Проверьте переменные окружения.';
  }
  return (
    `Kaspi Pay не настроен: задайте ${missing.join(', ')} в .env ` +
    `(ключи: ${KASPI_DOCS_URL}). См. apps/web/.env.example`
  );
}

export function isPaymentProviderReady(name: PaymentProviderName): boolean {
  if (name === 'mock') {
    return process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_PAYMENT === 'true';
  }
  if (name === 'kaspi') {
    return Boolean(process.env.KASPI_API_KEY);
  }
  if (name === 'freedom') {
    return process.env.FREEDOM_PAY_ENABLED === 'true' && Boolean(process.env.FREEDOM_API_KEY);
  }
  return false;
}

/**
 * Provider used at checkout. Dev defaults to mock; production requires explicit config.
 */
export function resolveCheckoutProvider(requested?: PaymentProviderName): PaymentProviderName {
  if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_PAYMENT === 'true') {
    if (requested === 'kaspi' || requested === 'freedom') {
      if (!isPaymentProviderReady(requested)) {
        const message =
          requested === 'kaspi'
            ? formatKaspiConfigError()
            : `Провайдер «${requested}» ещё не настроен. Добавьте ключи в .env или используйте mock в разработке.`;
        throw new ApiError('payment_not_configured', message, 503);
      }
      return requested;
    }
    return 'mock';
  }

  const configured = getConfiguredPaymentProvider();
  if (!configured || configured === 'mock') {
    throw new ApiError(
      'payment_not_configured',
      'Оплата временно недоступна. Дождитесь подключения платёжной системы или свяжитесь с поддержкой.',
      503
    );
  }

  if (!isPaymentProviderReady(configured)) {
    const message =
      configured === 'kaspi'
        ? formatKaspiConfigError()
        : `Платёжный провайдер «${configured}» выбран, но ключи API не заданы.`;
    throw new ApiError('payment_not_configured', message, 503);
  }

  return configured;
}
