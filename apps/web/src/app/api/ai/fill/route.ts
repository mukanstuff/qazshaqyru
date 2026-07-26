import { NextRequest, NextResponse } from 'next/server';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  rateLimitResponse,
  requireAuth,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { aiFillInputSchema, fillInvitationFields } from '@/lib/ai/fill-invitation';

/** Authenticated: fill invitation text fields via AI (or offline fallback). */
export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, `ai_fill:${ctx.user.id}`, RATE_LIMITS.API_AI_FILL);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = aiFillInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const result = await fillInvitationFields(parsed.data);
    return NextResponse.json({
      data: result.data,
      source: result.source,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'AI fill');
  }
}
