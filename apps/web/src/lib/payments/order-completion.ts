import type { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import { defaultCustomTextWithOpenRsvp } from '@/lib/guests/open-rsvp-config';
import { applyPlanUnlockInTx } from '@/lib/payments/apply-plan-unlock';

export type CompleteOrderResult =
  | { ok: true; invitationId: string | null; alreadyPaid: boolean }
  | { ok: false; reason: 'not_found' | 'amount_mismatch' | 'cancelled' | 'wrong_order_type' };

async function publishInvitationInTx(
  tx: Prisma.TransactionClient,
  invitationId: string
): Promise<boolean> {
  const invitation = await tx.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, status: true, customText: true, eventType: true },
  });

  if (!invitation || invitation.status !== 'draft') {
    return false;
  }

  const customText = defaultCustomTextWithOpenRsvp(invitation.customText, invitation.eventType);

  const result = await tx.invitation.updateMany({
    where: { id: invitationId, status: 'draft' },
    data: {
      status: 'published',
      publishedAt: new Date(),
      customText: customText as Prisma.InputJsonValue,
    },
  });

  return result.count > 0;
}

/**
 * Mark order as paid and publish linked invitation atomically.
 * Used by Kaspi/Freedom webhook and mock-pay.
 */
export async function completeOrderPayment(
  orderId: string,
  options?: { paidAmountKzt?: number; expectedProvider?: string; expectedPaymentId?: string }
): Promise<CompleteOrderResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: 'not_found' };

  if (order.orderType !== 'self') {
    return { ok: false, reason: 'wrong_order_type' };
  }

  if (
    options?.expectedProvider &&
    order.paymentProvider &&
    order.paymentProvider !== options.expectedProvider
  ) {
    return { ok: false, reason: 'not_found' };
  }

  if (
    options?.expectedPaymentId &&
    order.paymentId &&
    order.paymentId !== options.expectedPaymentId
  ) {
    return { ok: false, reason: 'not_found' };
  }

  if (order.status === 'cancelled') {
    return { ok: false, reason: 'cancelled' };
  }

  if (
    options?.paidAmountKzt !== undefined &&
    order.amountKzt !== options.paidAmountKzt
  ) {
    return { ok: false, reason: 'amount_mismatch' };
  }

  if (order.status === 'paid') {
    await prisma.$transaction(async (tx) => {
      if (order.invitationId) {
        await publishInvitationInTx(tx, order.invitationId!);
      }
      await applyPlanUnlockInTx(tx, order);
    });
    return { ok: true, invitationId: order.invitationId, alreadyPaid: true };
  }

  if (order.status !== 'pending') {
    return { ok: false, reason: 'not_found' };
  }

  const invitationId = order.invitationId;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });

    if (updated.count !== 1) {
      return { ok: false as const, reason: 'not_found' as const };
    }

    if (invitationId) {
      await publishInvitationInTx(tx, invitationId);
    }

    const paidOrder = await tx.order.findUnique({ where: { id: orderId } });
    if (paidOrder) {
      await applyPlanUnlockInTx(tx, paidOrder);
    }

    return { ok: true as const };
  });

  if (!result.ok) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (existing?.status === 'paid') {
      await prisma.$transaction(async (tx) => {
        if (existing.invitationId) {
          await publishInvitationInTx(tx, existing.invitationId!);
        }
        await applyPlanUnlockInTx(tx, existing);
      });
      return { ok: true, invitationId: existing.invitationId, alreadyPaid: true };
    }
    return { ok: false, reason: 'not_found' };
  }

  return { ok: true, invitationId, alreadyPaid: false };
}
