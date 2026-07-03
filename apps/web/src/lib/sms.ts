import { normalizePhone } from './auth';

export type SmsProviderName = 'mock' | 'twilio' | 'kz';

export interface SMSProvider {
  send(phone: string, message: string): Promise<boolean>;
}

class MockSMSProvider implements SMSProvider {
  async send(_phone: string, _message: string): Promise<boolean> {
    console.log('[Mock SMS] To: [REDACTED] Message: [REDACTED]');
    console.log('[Mock SMS] (Mock mode - no actual SMS sent)');
    return true;
  }
}

class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async send(phone: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: normalizePhone(phone),
            From: this.fromNumber,
            Body: message,
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Twilio error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return false;
    }
  }
}

/**
 * Kazakhstan SMS gateway placeholder (Mobizon / smsc.kz style).
 * Configure KZ_SMS_API_KEY + optional KZ_SMS_API_URL / KZ_SMS_SENDER.
 */
class KzSmsProvider implements SMSProvider {
  private apiKey: string;
  private sender: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.KZ_SMS_API_KEY || '';
    this.sender = process.env.KZ_SMS_SENDER || 'Invito';
    this.apiUrl =
      process.env.KZ_SMS_API_URL || 'https://api.mobizon.kz/service/message/sendsmsmessage';
  }

  async send(phone: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error(`[KZ SMS] ${formatSmsConfigError()}`);
      return false;
    }

    try {
      const body = new URLSearchParams({
        apiKey: this.apiKey,
        recipient: normalizePhone(phone),
        text: message,
      });
      if (this.sender) {
        body.set('from', this.sender);
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const text = await response.text();
        const hint =
          response.status === 401 || response.status === 403
            ? ' — проверьте KZ_SMS_API_KEY'
            : response.status === 404
              ? ' — проверьте KZ_SMS_API_URL'
              : '';
        console.error(`[KZ SMS] API error (${response.status})${hint}:`, text.slice(0, 200));
        return false;
      }

      return true;
    } catch (error) {
      console.error('[KZ SMS] send error:', error);
      return false;
    }
  }
}

let smsProvider: SMSProvider | undefined;

export function getSmsProviderName(): SmsProviderName {
  return getSmsProviderNameFromEnv(process.env);
}

export function getSMSProvider(): SMSProvider {
  if (!smsProvider) {
    switch (getSmsProviderName()) {
      case 'twilio':
        smsProvider = new TwilioSMSProvider();
        break;
      case 'kz':
        smsProvider = new KzSmsProvider();
        break;
      case 'mock':
      default:
        smsProvider = new MockSMSProvider();
        break;
    }
  }
  return smsProvider;
}

/** @internal tests only */
export function resetSmsProviderCacheForTests(): void {
  smsProvider = undefined;
}

export function getKzSmsMissingCredentials(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing: string[] = [];
  if (!env.KZ_SMS_API_KEY?.trim()) missing.push('KZ_SMS_API_KEY');
  return missing;
}

export function isSmsProviderReady(env: NodeJS.ProcessEnv = process.env): boolean {
  const provider = getSmsProviderNameFromEnv(env);
  if (provider === 'mock') return env.NODE_ENV !== 'production';
  if (provider === 'kz') return getKzSmsMissingCredentials(env).length === 0;
  if (provider === 'twilio') {
    return Boolean(
      env.TWILIO_ACCOUNT_SID?.trim() &&
        env.TWILIO_AUTH_TOKEN?.trim() &&
        env.TWILIO_PHONE_NUMBER?.trim()
    );
  }
  return false;
}

function getSmsProviderNameFromEnv(env: NodeJS.ProcessEnv): SmsProviderName {
  const raw = env.SMS_PROVIDER || 'mock';
  if (raw === 'twilio' || raw === 'kz') return raw;
  return 'mock';
}

export function formatSmsConfigError(env: NodeJS.ProcessEnv = process.env): string {
  const provider = getSmsProviderNameFromEnv(env);
  if (provider === 'mock') {
    if (env.NODE_ENV === 'production') {
      return 'SMS_PROVIDER=mock недопустим в production — задайте SMS_PROVIDER=kz и KZ_SMS_API_KEY';
    }
    return 'SMS в режиме mock (коды только в логах / ALLOW_DEV_OTP_CODE)';
  }
  if (provider === 'kz') {
    const missing = getKzSmsMissingCredentials(env);
    if (missing.length === 0) return 'KZ SMS настроен';
    return (
      `SMS не настроен: задайте ${missing.join(', ')} в .env ` +
      '(Mobizon, smsc.kz). См. apps/web/.env.example'
    );
  }
  const missing = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'].filter(
    (k) => !env[k]?.trim()
  );
  if (missing.length === 0) return 'Twilio SMS настроен';
  return `SMS не настроен: задайте ${missing.join(', ')} в .env`;
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  const provider = getSMSProvider();
  const message = `Ваш код подтверждения: ${code}. Действует 5 минут. Не сообщайте код никому.`;
  return provider.send(phone, message);
}
