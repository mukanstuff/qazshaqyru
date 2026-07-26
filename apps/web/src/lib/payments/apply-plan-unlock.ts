import type { PlanSku, PaidPlanSku } from '@/lib/entitlements';
import { AGENCY_DURATION_DAYS, comparePlans, getPlanDefinition } from '@/lib/entitlements';
import type { Prisma } from '@prisma/client';

/** Apply unlock after a paid self-order completes. */
export async function applyPlanUnlockInTx(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    userId: string | null;
    invitationId: string | null;
    planSku: PlanSku | string | null;
    planScope: string | null;
    planDurationDays: number | null;
  }
): Promise<void> {
  const sku = (order.planSku ?? 'standard') as PaidPlanSku;
  const def = getPlanDefinition(sku);
  const now = new Date();

  if (sku === 'agency' || order.planScope === 'user' || def.userLevel) {
    if (!order.userId) return;
    const days = order.planDurationDays ?? AGENCY_DURATION_DAYS;
    const user = await tx.user.findUnique({
      where: { id: order.userId },
      select: { planExpiresAt: true, planSku: true },
    });
    const base =
      user?.planExpiresAt && user.planExpiresAt.getTime() > now.getTime()
        ? user.planExpiresAt
        : now;
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    await tx.user.update({
      where: { id: order.userId },
      data: {
        planSku: 'agency',
        planExpiresAt: expiresAt,
        planActivatedAt: now,
      },
    });
    return;
  }

  if (!order.invitationId) return;

  const invitation = await tx.invitation.findUnique({
    where: { id: order.invitationId },
    select: { unlockedPlanSku: true },
  });

  const current = (invitation?.unlockedPlanSku as PlanSku | null) ?? 'free';
  const next = comparePlans(sku, current) >= 0 ? sku : current;
  if (next === 'free') return;

  await tx.invitation.update({
    where: { id: order.invitationId },
    data: {
      unlockedPlanSku: next as 'standard' | 'premium' | 'agency',
      unlockedAt: now,
      unlockOrderId: order.id,
    },
  });
}
