import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import {
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  ApiError,
} from '@/lib/shared/api';
import { sendManualPaymentApprovalRequest } from '@/lib/shared/notifications';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Fired when the customer taps "Я оплатил" on a manual Kaspi order (see
 * MANUAL_KASPI_PROVIDER in lib/payments/checkout.ts — no webhook exists for
 * this payment path). Sends the site owner a Telegram message with
 * Подтвердить/Отклонить buttons so they can approve from their phone after
 * checking the transfer in their own Kaspi Pay app, instead of needing to
 * open /admin/orders on a computer.
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const rate = await applyRateLimit(request, `notify-manual-pay:${ctx.user.id}`, RATE_LIMITS.API_GENERAL);
    if (!rate.allowed) return rateLimitResponse(rate);

    const order = await prisma.order.findFirst({
      where: { id, userId: ctx.user.id, status: 'pending' },
      include: { invitation: { select: { title: true } } },
    });
    if (!order) {
      throw new ApiError('not_found', 'Заказ не найден или уже обработан', 404);
    }

    const sent = await sendManualPaymentApprovalRequest({
      orderId: order.id,
      invitationTitle: order.invitation?.title ?? 'Приглашение',
      amountKzt: order.amountKzt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    });

    return NextResponse.json({ success: true, notified: sent !== null });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Notify manual payment');
  }
}
