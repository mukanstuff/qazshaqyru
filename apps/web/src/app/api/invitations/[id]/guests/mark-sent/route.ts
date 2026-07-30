import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

const bodySchema = z.object({
  guestIds: z.array(z.string().uuid()).min(1).max(500),
  sentVia: z.enum(['whatsapp', 'sms', 'telegram', 'email']).default('whatsapp'),
});

/**
 * Mark guests as sent (manual WA funnel). Does not send messages.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();
    const rate = await applyRateLimit(
      request,
      `mark-sent:${ctx.user.id}`,
      RATE_LIMITS.API_INVITATION_SEND
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const pricing = await getInvitationPricing(id, ctx.user.id);
    if (!pricing) throw new ApiError('not_found', 'Приглашение не найдено', 404);
    if (!pricing.fullAccess && !pricing.entitlements.guestOps) {
      throw new ApiError('plan_required', 'Операции с гостями доступны после оплаты цены шаблона', 402);
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const now = new Date();
    const result = await prisma.guest.updateMany({
      where: {
        invitationId: id,
        id: { in: parsed.data.guestIds },
        invitation: { userId: ctx.user.id },
      },
      data: {
        sentAt: now,
        sentVia: parsed.data.sentVia,
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      sentAt: now.toISOString(),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Mark guests sent');
  }
}
