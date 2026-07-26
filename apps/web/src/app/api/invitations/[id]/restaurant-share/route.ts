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
import {
  createOrRotateRestaurantShare,
  revokeRestaurantShares,
} from '@/lib/restaurant/share-service';

const postSchema = z.object({
  label: z.string().max(120).nullable().optional(),
});

function getAppUrl(request: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') {
    return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  }
  throw new ApiError('misconfigured', 'APP_URL is required in production', 500);
}

/** Create / rotate restaurant magic link. */
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
    const rate = await applyRateLimit(request, `rest-share:${ctx.user.id}`, RATE_LIMITS.API_GUEST_EXPORT);
    if (!rate.allowed) return rateLimitResponse(rate);

    const raw = await request.json().catch(() => ({}));
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400);
    }

    const share = await createOrRotateRestaurantShare({
      invitationId: id,
      userId: ctx.user.id,
      label: parsed.data.label,
      origin: getAppUrl(request),
    });

    return NextResponse.json({
      success: true,
      url: share.url,
      expiresAt: share.expiresAt.toISOString(),
      shareId: share.shareId,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Restaurant share');
  }
}

/** Revoke all active restaurant links. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { id } = await params;
    const ctx = await requireAuth();
    const count = await revokeRestaurantShares({ invitationId: id, userId: ctx.user.id });
    return NextResponse.json({ success: true, revoked: count });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Revoke restaurant share');
  }
}
