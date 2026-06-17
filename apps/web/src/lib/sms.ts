export interface SMSProvider {
  send(phone: string, message: string): Promise<boolean>;
}

class MockSMSProvider implements SMSProvider {
  async send(phone: string, message: string): Promise<boolean> {
    console.log(`\n[Mock SMS] To: ${phone}`);
    console.log(`[Mock SMS] Message: ${message}`);
    console.log('[Mock SMS] (Mock mode - no actual SMS sent)\n');
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
            'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: this.normalizePhone(phone),
            From: this.fromNumber,
            Body: message,
          }),
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

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('8') && cleaned.length === 11) {
      cleaned = '7' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  }
}

let smsProvider: SMSProvider;

export function getSMSProvider(): SMSProvider {
  if (!smsProvider) {
    const providerType = process.env.SMS_PROVIDER || 'mock';
    
    switch (providerType) {
      case 'twilio':
        smsProvider = new TwilioSMSProvider();
        break;
      case 'mock':
      default:
        smsProvider = new MockSMSProvider();
        break;
    }
  }
  return smsProvider;
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  const provider = getSMSProvider();
  const message = `Ваш код подтверждения: ${code}. Действует 5 минут. Не сообщайте код никому.`;
  return provider.send(phone, message);
}
