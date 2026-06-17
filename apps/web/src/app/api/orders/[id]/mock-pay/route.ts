import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { nanoid } from 'nanoid';
import { requireAuth } from '@/lib/api';
import { getPaymentProvider } from '@/lib/payments';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

/**
 * Mock-pay endpoint: only callable when the mock provider is enabled
 * (development or explicit opt-in). Marks the order paid and materialises
 * the draft Invitation using the event snapshot stored on the Order.
 *
 * The transition pending -> paid is performed atomically: if a concurrent
 * request already paid the order, the second call is a no-op and we just
 * redirect to the existing invitation.
 */
export async function POST(request: NextRequest, { params }: Props) {
  const { id } = params;

  const ctx = await requireAuth();
  const provider = getPaymentProvider('mock');

  // Atomically transition pending -> paid. The conditional WHERE ensures
  // we don't double-create invitations on a retry.
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== ctx.user.id) {
    redirect('/dashboard?payment=invalid');
  }

  if (order.status === 'paid' && order.invitationId) {
    redirect(`/invitations/${order.invitationId}?paid=1`);
  }

  if (order.status !== 'pending') {
    redirect('/dashboard?payment=invalid');
  }

  // Materialise the invitation and the paid order in a single transaction.
  // If anything fails after we've already updated the order, the
  // transaction rolls back and the order stays pending.
  const result = await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.create({
      data: {
        userId: order.userId,
        templateId: order.templateId,
        title: order.customerName || 'Новое приглашение',
        eventType: order.eventType || 'other',
        eventDate: order.eventDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        slug: `${nanoid(10)}-invitation`,
        status: 'draft',
      },
    });

    const updated = await tx.order.updateMany({
      where: { id: order.id, status: 'pending' },
      data: {
        status: 'paid',
        paidAt: new Date(),
        invitationId: invitation.id,
      },
    });

    if (updated.count !== 1) {
      // Concurrent payment - abort and let the caller redirect to the
      // existing invitation (if any).
      throw new Error('order-already-paid');
    }

    return invitation;
  }).catch(async (err) => {
    if (err instanceof Error && err.message === 'order-already-paid') {
      const existing = await prisma.order.findUnique({ where: { id: order.id } });
      if (existing?.invitationId) {
        return { id: existing.invitationId } as { id: string };
      }
    }
    throw err;
  });

  // The mock provider's createPayment would have moved the order to paid
  // by itself, so the only thing we need to do is notify it (idempotent
  // for our purposes - we already updated the order).
  try {
    await provider.createPayment({
      orderId: order.id,
      amountKzt: order.amountKzt,
      description: 'mock-pay confirm',
      customerPhone: order.customerPhone,
      successUrl: '',
      failUrl: '',
    });
  } catch {
    // Mock provider errors here are non-fatal - the order is already paid.
  }

  redirect(`/invitations/${result.id}?paid=1`);
}
