import prisma from '@/lib/shared/db';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { isStalePendingOrder } from '@/lib/payments/pricing-integrity';

export interface InvitationPaymentSyncResult {
  unpublished: boolean;
  cancelledPendingOrders: number;
}

/**
 * After template/price change: cancel stale pending orders and unpublish if payment no longer valid.
 */
export async function syncInvitationPaymentState(
  invitationId: string,
  userId: string
): Promise<InvitationPaymentSyncResult> {
  const pricing = await getInvitationPricing(invitationId, userId);
  if (!pricing) return { unpublished: false, cancelledPendingOrders: 0 };

  const pendingOrders = await prisma.order.findMany({
    where: { invitationId, status: 'pending' },
    select: { id: true, templateId: true, amountKzt: true, status: true },
  });

  type SyncOrderRow = { id: string; templateId: string; amountKzt: number; status: 'pending' | 'paid' | 'cancelled' | 'refunded' };
  const staleIds = pendingOrders
    .filter((o: SyncOrderRow) =>
      isStalePendingOrder(
        { templateId: o.templateId, amountKzt: o.amountKzt, status: o.status },
        pricing.templateId,
        pricing.priceKzt
      )
    )
    .map((o: SyncOrderRow) => o.id);

  let cancelledPendingOrders = 0;
  if (staleIds.length > 0) {
    const cancelled = await prisma.order.updateMany({
      where: { id: { in: staleIds }, status: 'pending' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    cancelledPendingOrders = cancelled.count;
  }

  let unpublished = false;
  if (pricing.priceKzt > 0 && !pricing.hasPaidOrder) {
    const updated = await prisma.invitation.updateMany({
      where: { id: invitationId, userId, status: 'published' },
      data: { status: 'draft', publishedAt: null },
    });
    unpublished = updated.count > 0;
  }

  return { unpublished, cancelledPendingOrders };
}
