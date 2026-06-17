/**
 * Payment provider abstraction.
 *
 * Real integrations:
 * - Kaspi Pay (KZ): see https://pay.kaspi.kz/paydocs
 * - Stripe (international cards): see https://stripe.com/docs/api
 *
 * Mock provider exists for local development only. Calling
 * `getPaymentProvider('mock')` in production throws.
 */

import prisma from './db';
import { nanoid } from 'nanoid';
import { createHmac, timingSafeEqual } from 'crypto';

export interface PaymentProvider {
  createPayment(params: {
    orderId: string;
    amountKzt: number;
    description: string;
    customerPhone: string;
    successUrl: string;
    failUrl: string;
  }): Promise<{ paymentId: string; paymentUrl: string }>;

  verifyWebhook(body: string, signature: string): Promise<{ orderId: string; status: 'paid' | 'failed' } | null>;
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
      throw new Error('KASPI_API_KEY is not configured');
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
      throw new Error(`Kaspi API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return { paymentId: data.id, paymentUrl: data.payment_url };
  }

  async verifyWebhook(body: string, signature: string) {
    const secret = process.env.KASPI_WEBHOOK_SECRET;
    if (!secret) return null;

    const expected = createHmac('sha256', secret).update(body).digest('hex');
    if (!constantTimeEqualHex(expected, signature)) return null;

    try {
      const data = JSON.parse(body);
      return {
        orderId: data.order_id,
        status: data.status === 'success' ? ('paid' as const) : ('failed' as const),
      };
    } catch {
      return null;
    }
  }
}

class StripeProvider implements PaymentProvider {
  async createPayment(params: {
    orderId: string;
    amountKzt: number;
    description: string;
    customerPhone: string;
    successUrl: string;
    failUrl: string;
  }) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error('STRIPE_SECRET_KEY is not configured');

    // Stripe SDK is loaded dynamically so the app does not require it
    // at boot in environments where only Kaspi is used. If the package
    // is not installed, we surface a configuration error rather than a
    // mysterious "module not found" at runtime.
    // The `as string` cast tells TypeScript "this is a runtime string,
    // don't resolve it at typecheck time". Without it, missing type
    // declarations for the optional `stripe` package break the build.
    const stripeModuleName = 'stripe' as string;
    type StripeModule = { default: new (key: string) => unknown };
    let StripeCtor: new (key: string) => unknown;
    try {
      const mod = (await import(/* webpackIgnore: false */ stripeModuleName)) as StripeModule;
      StripeCtor = mod.default;
    } catch {
      throw new Error(
        'Stripe SDK is not installed. Add `stripe` to package.json or use the kaspi/mock provider.'
      );
    }
    const stripe = new StripeCtor(apiKey) as {
      checkout: {
        sessions: {
          create: (params: {
            mode: 'payment';
            payment_method_types: string[];
            line_items: Array<{
              price_data: { currency: string; product_data: { name: string }; unit_amount: number };
              quantity: number;
            }>;
            success_url: string;
            cancel_url: string;
            metadata: Record<string, string>;
            customer_email?: string;
          }) => Promise<{ id: string; url?: string | null }>;
        };
      };
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'kzt',
            product_data: { name: params.description },
            unit_amount: params.amountKzt * 100,
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.failUrl,
      metadata: { orderId: params.orderId },
    });

    return { paymentId: session.id, paymentUrl: session.url! };
  }

  async verifyWebhook(body: string, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return null;

    try {
      const stripeModuleName = 'stripe' as string;
      type StripeModule = { default: new (key: string) => unknown };
      let StripeCtor: new (key: string) => unknown;
      try {
        const mod = (await import(/* webpackIgnore: false */ stripeModuleName)) as StripeModule;
        StripeCtor = mod.default;
      } catch {
        return null;
      }
      const stripe = new StripeCtor(process.env.STRIPE_SECRET_KEY || '') as {
        webhooks: { constructEvent: (body: string, sig: string, secret: string) => { type: string; data: { object: unknown } } };
      };
      const event = stripe.webhooks.constructEvent(body, signature, secret);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: { orderId?: string } };
        const orderId = session.metadata?.orderId;
        if (!orderId) return null;
        return { orderId, status: 'paid' as const };
      }
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Mock provider for local development.
 *
 * Important: in production, attempting to use this provider is a
 * configuration error. We refuse loudly instead of silently allowing
 * "real money, fake payment" flow.
 */
class MockPaymentProvider implements PaymentProvider {
  async createPayment(params: {
    orderId: string;
    amountKzt: number;
    description: string;
    customerPhone: string;
    successUrl: string;
    failUrl: string;
  }) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENT !== 'true') {
      throw new Error(
        'Mock payment provider is disabled in production. ' +
          'Set ALLOW_MOCK_PAYMENT=true to override (not recommended).'
      );
    }

    const paymentId = `mock_${nanoid(16)}`;
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    // Mark the order paid atomically. We only transition pending -> paid;
    // any other status means the order is already terminal and we leave
    // it alone. This prevents a double-submit from creating phantom state.
    const updateResult = await prisma.order.updateMany({
      where: { id: params.orderId, status: 'pending' },
      data: { paymentId, status: 'paid', paidAt: new Date() },
    });

    if (updateResult.count === 1) {
      const order = await prisma.order.findUnique({ where: { id: params.orderId } });
      if (order?.invitationId) {
        await prisma.invitation.update({
          where: { id: order.invitationId },
          data: { status: 'draft' },
        });
      }
    }

    const paymentUrl = `${baseUrl}/mock-payment?orderId=${params.orderId}&token=${paymentId}`;
    return { paymentId, paymentUrl };
  }

  async verifyWebhook() {
    return null;
  }
}

export function getPaymentProvider(name: 'kaspi' | 'stripe' | 'mock'): PaymentProvider {
  if (name === 'stripe') return new StripeProvider();
  if (name === 'kaspi') return new KaspiPayProvider();
  if (name === 'mock') {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENT !== 'true') {
      throw new Error('Mock payment provider is not allowed in production');
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
