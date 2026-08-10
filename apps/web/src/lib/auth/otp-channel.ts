import 'server-only';
import { normalizePhone } from '@/lib/auth';

export type OtpChannelName = 'whatsapp';

export interface OtpChannel {
  /** Stable channel id (used for logging + Identity.provider mapping). */
  readonly name: OtpChannelName;
  /** Send a one-time code. Returns true if the gateway accepted the message. */
  sendOtp(phone: string, code: string): Promise<boolean>;
}

/** Returns the count of required env vars still missing. */
export function getWhatsappMissingCredentials(env: NodeJS.ProcessEnv = process.env): string[] {
  const need = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_AUTH_TEMPLATE_NAME',
  ] as const;
  return need.filter((k) => !env[k]?.trim()) as string[];
}

export function isWhatsappOtpReady(env: NodeJS.ProcessEnv = process.env): boolean {
  if ((env.AUTH_WHATSAPP_ENABLED || '').toLowerCase() !== 'true') return false;
  return getWhatsappMissingCredentials(env).length === 0;
}

export function formatWhatsappConfigError(env: NodeJS.ProcessEnv = process.env): string {
  if (!isWhatsappOtpEnabled(env)) {
    return 'WhatsApp OTP выключен (AUTH_WHATSAPP_ENABLED != true)';
  }
  const missing = getWhatsappMissingCredentials(env);
  if (missing.length === 0) return 'WhatsApp OTP настроен';
  return `WhatsApp OTP: задайте ${missing.join(', ')} в .env`;
}

function isWhatsappOtpEnabled(env: NodeJS.ProcessEnv): boolean {
  return (env.AUTH_WHATSAPP_ENABLED || '').toLowerCase() === 'true';
}

class WhatsappOtpChannel implements OtpChannel {
  readonly name: OtpChannelName = 'whatsapp';

  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (!isWhatsappOtpReady()) {
      console.error(`[WhatsApp OTP] ${formatWhatsappConfigError()}`);
      return false;
    }
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    const templateName = process.env.WHATSAPP_AUTH_TEMPLATE_NAME!;
    const templateLanguage = process.env.WHATSAPP_AUTH_TEMPLATE_LANGUAGE || 'ru';

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            type: 'template',
            to: normalizePhone(phone).replace(/^\+/, ''),
            template: {
              name: templateName,
              language: { code: templateLanguage },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: code },
                    { type: 'text', text: '5' },
                  ],
                },
              ],
            },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error(`[WhatsApp OTP] API error (${res.status}):`, text.slice(0, 200));
        return false;
      }
      return true;
    } catch (error) {
      console.error('[WhatsApp OTP] send error:', error);
      return false;
    }
  }
}

let cachedChannel: OtpChannel | undefined;

export function getOtpChannel(): OtpChannel {
  if (cachedChannel) return cachedChannel;
  // Single channel for now: WhatsApp. When enabled at all, it's the only path.
  cachedChannel = new WhatsappOtpChannel();
  return cachedChannel;
}

/** For tests only. */
export function resetOtpChannelCacheForTests(): void {
  cachedChannel = undefined;
}

export async function sendOtp(phone: string, code: string): Promise<boolean> {
  return getOtpChannel().sendOtp(phone, code);
}