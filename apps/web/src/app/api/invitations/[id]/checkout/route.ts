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
import { checkoutInvitation } from '@/lib/payments/checkout';
import prisma from '@/lib/shared/db';

const bodySchema = z.object({
  provider: z.enum(['kaspi', 'freedom', 'mock']).optional(),
  intent: z.enum(['publish', 'pay', 'plan', 'agency']).optional(),
  planSku: z.string().min(1).max(64).optional(),
});

function getAppUrl(request: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') {
    return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  }
  throw new ApiError('misconfigured', 'APP_URL is required in production', 500);
}

/**
 * POST /api/invitations/[id]/checkout
 * publish = legacy freemium (being phased out). pay = template price purchase → full access.
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

    const rate = await applyRateLimit(request, ctx.user.id, RATE_LIMITS.API_INVITATION_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const pricing = await import('@/lib/invitations/invitation-pricing').then((m) =>
      m.getInvitationPricing(id, ctx.user.id)
    );
    if (pricing?.templateId) {
      await prisma.invitation.updateMany({
        where: { id, userId: ctx.user.id, templateId: null },
        data: { templateId: pricing.templateId },
      });
    }

    const result = await checkoutInvitation(id, ctx.user, {
      appUrl: getAppUrl(request),
      provider: parsed.data.provider,
      // HOTFIX: server default must be 'pay' (symmetric to client + product model)
      intent: parsed.data.intent ?? 'pay',
      planSku: parsed.data.planSku,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Checkout invitation');
  }
}
