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
import { checkPromoCode, PROMO_FAILURE_MESSAGES } from '@/lib/payments/promo';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { getI18n } from '@/i18n/server';

const bodySchema = z.object({
  code: z.string().min(1).max(40),
  /** Which purchase the code is being tried against. */
  target: z.enum(['template', 'agency']).default('template'),
  /** Required for 'template' — the discount depends on what is still owed. */
  invitationId: z.string().uuid().optional(),
});

/**
 * POST /api/promo/validate — price a code without spending it.
 *
 * The customer has to see the new total before deciding to pay, and finding out
 * a code is expired on the payment screen is the worst place to learn it. This
 * consumes nothing: the redemption is taken at checkout, inside the transaction
 * that creates the order.
 *
 * Rate-limited and login-only, because an open endpoint that says whether a
 * string is a valid code is a code-guessing oracle.
 */
export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, `promo:${ctx.user.id}`, RATE_LIMITS.API_PROMO_VALIDATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const { locale } = await getI18n();
    const { code, target, invitationId } = parsed.data;

    let amountKzt = 0;
    if (target === 'template') {
      if (!invitationId) {
        throw new ApiError('validation_error', 'Не указано приглашение', 400);
      }
      const pricing = await getInvitationPricing(invitationId, ctx.user.id);
      if (!pricing) throw new ApiError('not_found', 'Приглашение не найдено', 404);
      amountKzt = Math.max(pricing.priceKzt - pricing.totalPaidKzt, 0) || pricing.priceKzt;
    } else {
      const { getPlanDefinition } = await import('@/lib/entitlements');
      amountKzt = getPlanDefinition('agency').priceKzt;
    }

    const check = await checkPromoCode(code, amountKzt, target);
    if (!check.ok) {
      return NextResponse.json({
        valid: false,
        reason: check.reason,
        message: PROMO_FAILURE_MESSAGES[check.reason][locale],
      });
    }

    return NextResponse.json({
      valid: true,
      code: check.code,
      kind: check.kind,
      value: check.value,
      amountKzt,
      discountKzt: check.discountKzt,
      finalKzt: check.finalKzt,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Validate promo code');
  }
}
