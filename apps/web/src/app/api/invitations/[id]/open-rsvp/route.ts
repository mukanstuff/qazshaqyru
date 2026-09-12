import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  rateLimitResponse,
  requireAuth,
  RATE_LIMITS,
} from '@/lib/shared/api';

const bodySchema = z.object({ openRsvp: z.boolean() });

/**
 * PATCH /api/invitations/[id]/open-rsvp
 *
 * Turn answering from the plain public link on or off. Its own route rather
 * than a field on the general invitation PATCH: that one takes the whole
 * `customText` object, so a client flipping one boolean would have to send
 * back every other key it happens to hold and would silently drop anything it
 * did not know about.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const rate = await applyRateLimit(request, `open_rsvp_set:${ctx.user.id}`, RATE_LIMITS.API_GENERAL);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true, customText: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const current =
      invitation.customText && typeof invitation.customText === 'object' && !Array.isArray(invitation.customText)
        ? (invitation.customText as Record<string, unknown>)
        : {};

    await prisma.invitation.update({
      where: { id },
      data: { customText: { ...current, openRsvp: parsed.data.openRsvp } },
    });

    return NextResponse.json({ success: true, openRsvp: parsed.data.openRsvp });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Set open RSVP');
  }
}
