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

  type PrismaTx = any;
  if (order.status === 'paid') {
    await prisma.$transaction(async (tx: PrismaTx) => {
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

  const result = await prisma.$transaction(async (tx: PrismaTx) => {
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

    // === 2026-07-30 Product model enforcement ===
    // After successful template payment, ensure the invitation has a canvas document
    // if it doesn't yet (for legacy wizard flows that hit payment directly).
    // This guarantees the guest page and editor see the same document.
    if (invitationId) {
      try {
        const inv = await tx.invitation.findUnique({
          where: { id: invitationId },
          select: { canvas: true, title: true, eventType: true, eventDate: true, eventTime: true, eventPlace: true, address: true, eventTimezone: true, templateData: true, musicUrl: true, mapUrl: true, customText: true },
        });
        if (inv && !inv.canvas) {
          // Lazy import to avoid loading canvas in every tx
          const { convertLegacyToCanvas } = await import('@/lib/canvas/legacy-converter');
          const doc = convertLegacyToCanvas({
            title: inv.title,
            eventType: inv.eventType,
            eventDate: inv.eventDate,
            eventTime: inv.eventTime,
            eventPlace: inv.eventPlace,
            address: inv.address,
            eventTimezone: inv.eventTimezone || 'Asia/Almaty',
            templateData: inv.templateData as any,
            musicUrl: inv.musicUrl,
            mapUrl: inv.mapUrl,
            customText: inv.customText as any,
          });
          await tx.invitation.update({
            where: { id: invitationId },
            data: { canvas: doc as any },
          });
        }
      } catch {
        // non-fatal
      }
    }

    return { ok: true as const };
  });

  if (!result.ok) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (existing?.status === 'paid') {
      await prisma.$transaction(async (tx: PrismaTx) => {
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
