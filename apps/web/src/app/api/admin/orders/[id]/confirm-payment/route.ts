import { NextRequest, NextResponse } from 'next/server';
import {
  ApiError,
  apiErrorResponse,
  checkSameOrigin,
  requireAdmin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { completeOrderPayment } from '@/lib/payments/order-completion';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Manual payment confirmation for orders with no automated gateway behind
 * them (currently: Kaspi Pay manual-link orders — see
 * MANUAL_KASPI_PROVIDER in lib/payments/checkout.ts). An admin checks the
 * site owner's own Kaspi Pay app for the matching transfer, then clicks
 * this to unlock the invitation — same completion path a real webhook
 * would take (completeOrderPayment), so publish/entitlements stay
 * consistent with the automated flow.
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { user } = await requireAdmin();
    const rate = await applyRateLimit(request, `admin_confirm_payment:${user.id}`, RATE_LIMITS.API_ADMIN_MUTATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    const result = await completeOrderPayment(id);

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'Заказ не найден или уже не ожидает оплаты',
        amount_mismatch: 'Сумма не совпадает',
        cancelled: 'Заказ отменён',
        wrong_order_type: 'Этот тип заказа подтверждается иначе',
      };
      throw new ApiError('validation_error', messages[result.reason] ?? 'Не удалось подтвердить оплату', 400);
    }

    return NextResponse.json({ success: true, invitationId: result.invitationId });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Admin confirm manual payment');
  }
}
