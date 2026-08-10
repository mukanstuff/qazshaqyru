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

const bodySchema = z.object({
  provider: z.enum(['kaspi', 'freedom', 'mock']).optional(),
  intent: z.enum(['plan', 'agency']).optional(),
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

/** User-level Agency plan checkout (no invitation required). */
export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(
      request,
      `agency-checkout:${ctx.user.id}`,
      RATE_LIMITS.API_INVITATION_CREATE
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Некорректные параметры', 400);
    }

    const result = await checkoutInvitation(null, ctx.user, {
      appUrl: getAppUrl(request),
      provider: parsed.data.provider,
      intent: 'plan',
      planSku: 'agency',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Agency checkout');
  }
}
