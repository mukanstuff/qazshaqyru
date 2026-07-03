import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  requireAuth,
} from '@/lib/api';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { customTextSchema } from '@/lib/custom-text-schema';
import { buildFamilyPreviewUrl, createPreviewToken, issuePreviewToken } from '@/lib/preview-token';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Generate or return family preview link for a draft invitation. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const rate = await applyRateLimit(request, `family_preview:${ctx.user.id}`, RATE_LIMITS.API_GENERAL);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true, slug: true, status: true, customText: true, previewTokenHash: true },
    });

    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }
    if (invitation.status === 'published') {
      throw new ApiError('invalid_state', 'Приглашение уже опубликовано', 400);
    }

    const body = await request.json().catch(() => ({}));
    const rotate = Boolean((body as { rotate?: boolean }).rotate);
    const currentHash = invitation.previewTokenHash ?? null;
    const nextPreview = !rotate && currentHash
      ? { token: issuePreviewToken(currentHash), tokenHash: currentHash }
      : createPreviewToken();

    const prevCustom =
      invitation.customText && typeof invitation.customText === 'object'
        ? (invitation.customText as Record<string, unknown>)
        : {};
    const { familyPreviewToken: _legacyToken, familyPreviewTokenHash: _legacyHash, ...cleanCustom } = prevCustom;

    const merged = { ...cleanCustom };
    const parsed = customTextSchema.safeParse(merged);
    if (!parsed.success) {
      throw new ApiError('validation', 'Не удалось сохранить ссылку предпросмотра', 400);
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        customText: parsed.data as object,
        previewTokenHash: nextPreview.tokenHash,
      },
    });

    const origin = process.env.APP_URL || request.nextUrl.origin;
    const url = buildFamilyPreviewUrl(origin, invitation.slug, nextPreview.token);

    return NextResponse.json({
      url,
      slug: invitation.slug,
      rotated: rotate || !currentHash,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Family preview link');
  }
}
