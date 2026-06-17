import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPaymentProvider } from '@/lib/payments';

export const dynamic = 'force-dynamic';

interface Props {
  params: { provider: string };
}

/**
 * Webhook handler for Kaspi / Stripe.
 *
 * Idempotency strategy:
 * - The Order table has a unique (paymentProvider, paymentId) index.
 * - When a webhook arrives, we look up the order by that pair.
 * - We use `updateMany` with a `WHERE status = 'pending'` filter to
 *   perform the transition. If the row was already updated, count=0
 *   and we treat the call as a duplicate.
 * - If we get a notification for an orderId we don't recognise, we
 *   look it up by primary key and return 404 so the provider can retry
 *   only if it was a legitimate transient failure (not for new orders).
 *
 * Security: signature is verified inside `provider.verifyWebhook`. If it
 * returns null, we 401. We never trust the body without a valid signature.
 */
export async function POST(request: NextRequest, { params }: Props) {
  const providerName = params.provider;
  if (providerName !== 'kaspi' && providerName !== 'stripe') {
    return NextResponse.json({ error: 'unknown_provider' }, { status: 400 });
  }

  const body = await request.text();
  const signature =
    request.headers.get('x-kaspi-signature') ||
    request.headers.get('stripe-signature') ||
    '';

  const provider = getPaymentProvider(providerName);
  const result = await provider.verifyWebhook(body, signature);

  if (!result) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  if (!result.orderId) {
    return NextResponse.json({ error: 'missing_order_id' }, { status: 400 });
  }

  if (result.status === 'paid') {
    // Try to mark paid, only transitioning from pending. updateMany is
    // atomic: at most one concurrent webhook wins. Losers see count=0
    // and we treat it as already-processed.
    const updated = await prisma.order.updateMany({
      where: { id: result.orderId, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });

    if (updated.count === 1) {
      const order = await prisma.order.findUnique({ where: { id: result.orderId } });
      if (order?.invitationId) {
        await prisma.invitation.update({
          where: { id: order.invitationId },
          data: { status: 'draft' },
        });
      }
      return NextResponse.json({ ok: true });
    }

    const existing = await prisma.order.findUnique({ where: { id: result.orderId } });
    if (!existing) {
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  // result.status === 'failed'
  const updated = await prisma.order.updateMany({
    where: { id: result.orderId, status: 'pending' },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  if (updated.count === 0) {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }
  return NextResponse.json({ ok: true });
}
