import { NextRequest, NextResponse } from 'next/server';
import {
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  ApiError,
} from '@/lib/shared/api';
import { syncOrderPaymentStatus } from '@/lib/payments/payment-sync';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

/** Poll payment status when webhook is delayed (owner only). */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const rate = await applyRateLimit(request, `order-sync:${ctx.user.id}`, RATE_LIMITS.API_GENERAL);
    if (!rate.allowed) return rateLimitResponse(rate);
    const result = await syncOrderPaymentStatus(id, ctx.user.id);

    if (result.status === 'not_found') {
      return NextResponse.json(
        { error: 'not_found', message: 'Заказ не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      invitationId: result.status === 'paid' ? result.invitationId : null,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Sync order payment');
  }
}
