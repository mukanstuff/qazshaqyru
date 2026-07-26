/**

 * Payment provider abstraction.

 *

 * Real integrations (configure when ready):

 * - Kaspi Pay (KZ): https://pay.kaspi.kz/paydocs

 * - Freedom Pay (KZ): set FREEDOM_PAY_ENABLED=true + API credentials

 *

 * Mock provider exists for local development only.

 */



import { nanoid } from 'nanoid';

import { createHmac, timingSafeEqual } from 'crypto';

import { isMockPaymentAllowed } from '@/lib/payments/mock-payment-guard';
import { KaspiPaymentError, parseKaspiApiError } from '@/lib/payments/kaspi-errors';
import { formatKaspiConfigError } from '@/lib/payments/payment-provider-config';

import {

  parseFreedomWebhookPayload,

  parseKaspiWebhookPayload,

  type ParsedWebhookPayment,

} from '@/lib/payments/payment-webhook-status';



export type { ParsedWebhookPayment };



export interface PaymentProvider {

  createPayment(params: {

    orderId: string;

    amountKzt: number;

    description: string;

    customerPhone: string;

    successUrl: string;

    failUrl: string;

  }): Promise<{ paymentId: string; paymentUrl: string }>;



  verifyWebhook(body: string, signature: string): Promise<ParsedWebhookPayment | null>;

}



class KaspiPayProvider implements PaymentProvider {

  async createPayment(params: {

    orderId: string;

    amountKzt: number;

    description: string;

    customerPhone: string;

    successUrl: string;

    failUrl: string;

  }) {

    const apiUrl = process.env.KASPI_API_URL || 'https://pay.kaspi.kz/api/v1';

    const apiKey = process.env.KASPI_API_KEY;



    if (!apiKey) {
      throw new Error(formatKaspiConfigError());
    }



    const response = await fetch(`${apiUrl}/payments`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        'X-API-Key': apiKey,

      },

      body: JSON.stringify({

        order_id: params.orderId,

        amount: params.amountKzt * 100,

        currency: 'KZT',

        description: params.description,

        customer_phone: params.customerPhone,

        success_url: params.successUrl,

        fail_url: params.failUrl,

      }),

    });



    if (!response.ok) {
      const text = await response.text();
      throw new KaspiPaymentError(parseKaspiApiError(response.status, text));
    }



    const data = await response.json();

    if (!data?.id || !data?.payment_url) {
      throw new KaspiPaymentError({
        status: 502,
        message: 'Kaspi API вернул неполный ответ (ожидались id и payment_url)',
        raw: JSON.stringify(data).slice(0, 500),
      });
    }

    return { paymentId: data.id, paymentUrl: data.payment_url };

  }



  async verifyWebhook(body: string, signature: string) {

    const secret = process.env.KASPI_WEBHOOK_SECRET;

    if (!secret) {
      console.error(
        '[Kaspi webhook] KASPI_WEBHOOK_SECRET is not set — callbacks cannot be verified. ' +
          'Register webhook URL in Kaspi Business and set the secret in .env.'
      );
      return null;
    }

    if (!signature) {
      return null;
    }

    const expected = createHmac('sha256', secret).update(body).digest('hex');

    if (!constantTimeEqualHex(expected, signature)) return null;



    try {

      const data = JSON.parse(body) as { order_id?: string; status?: string; amount?: number };

      return parseKaspiWebhookPayload(data);

    } catch {

      return null;

    }

  }

}



/**

 * Freedom Pay — заготовка под интеграцию.

 * Включите FREEDOM_PAY_ENABLED=true и задайте ключи, когда выберете провайдера.

 */

class FreedomPayProvider implements PaymentProvider {

  async createPayment(params: {

    orderId: string;

    amountKzt: number;

    description: string;

    customerPhone: string;

    successUrl: string;

    failUrl: string;

  }) {

    const apiUrl = process.env.FREEDOM_API_URL;

    const apiKey = process.env.FREEDOM_API_KEY;



    if (process.env.FREEDOM_PAY_ENABLED !== 'true' || !apiUrl || !apiKey) {

      throw new Error(

        'Freedom Pay ещё не настроен. Задайте FREEDOM_PAY_ENABLED=true, FREEDOM_API_URL и FREEDOM_API_KEY.'

      );

    }



    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/payments`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${apiKey}`,

      },

      body: JSON.stringify({

        order_id: params.orderId,

        amount_kzt: params.amountKzt,

        description: params.description,

        customer_phone: params.customerPhone,

        success_url: params.successUrl,

        fail_url: params.failUrl,

      }),

    });



    if (!response.ok) {

      const text = await response.text();

      throw new Error(`Freedom Pay API error: ${response.status} ${text}`);

    }



    const data = (await response.json()) as { id?: string; payment_url?: string };

    if (!data.id || !data.payment_url) {

      throw new Error('Freedom Pay API returned an invalid response');

    }



    return { paymentId: data.id, paymentUrl: data.payment_url };

  }



  async verifyWebhook(body: string, signature: string) {

    const secret = process.env.FREEDOM_WEBHOOK_SECRET;

    if (!secret) return null;



    const expected = createHmac('sha256', secret).update(body).digest('hex');

    if (!constantTimeEqualHex(expected, signature)) return null;



    try {

      const data = JSON.parse(body) as {

        order_id?: string;

        status?: string;

        amount_kzt?: number;

        amount?: number;

      };

      return parseFreedomWebhookPayload(data);

    } catch {

      return null;

    }

  }

}



class MockPaymentProvider implements PaymentProvider {

  async createPayment(params: {

    orderId: string;

    amountKzt: number;

    description: string;

    customerPhone: string;

    successUrl: string;

    failUrl: string;

  }) {

    if (!isMockPaymentAllowed()) {

      throw new Error('Mock payment provider is disabled');

    }



    const paymentId = `mock_${nanoid(16)}`;
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/mock-payment?orderId=${params.orderId}&token=${paymentId}`;
    return { paymentId, paymentUrl };

  }



  async verifyWebhook() {

    return null;

  }

}



export function getPaymentProvider(name: 'kaspi' | 'freedom' | 'mock'): PaymentProvider {

  if (name === 'freedom') return new FreedomPayProvider();

  if (name === 'kaspi') return new KaspiPayProvider();

  if (name === 'mock') {

    if (!isMockPaymentAllowed()) {

      throw new Error('Mock payment provider is not allowed');

    }

    return new MockPaymentProvider();

  }

  throw new Error(`Unknown payment provider: ${name}`);

}



function constantTimeEqualHex(a: string, b: string): boolean {

  if (a.length !== b.length) return false;

  try {

    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

  } catch {

    return false;

  }

}


