import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyAuthReadRateLimit,
  rateLimitResponse,
  parseJsonBody,
} from '@/lib/shared/api';
import { serializeGuestsForApi } from '@/lib/guests/guest-serialize';
import { invitationUpdateBodySchema } from '@/lib/invitations/schemas';
import { updateInvitationForUser } from '@/lib/invitations/InvitationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const readRate = await applyAuthReadRateLimit(request, ctx.user.id);
    if (!readRate.allowed) return rateLimitResponse(readRate);

    const guestPage = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get('guestPage') ?? '1', 10) || 1);
    const guestLimit = Math.min(
      100,
      Math.max(1, Number.parseInt(request.nextUrl.searchParams.get('guestLimit') ?? '100', 10) || 100)
    );

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      include: {
        template: true,
        _count: { select: { guests: true } },
      },
    });

    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const guests = await prisma.guest.findMany({
      where: { invitationId: invitation.id },
      include: { response: true },
      orderBy: { createdAt: 'asc' },
      skip: (guestPage - 1) * guestLimit,
      take: guestLimit,
    });

    const { _count, ...invitationData } = invitation;

    return NextResponse.json({
      invitation: {
        ...invitationData,
        guests: serializeGuestsForApi(guests),
        guestsTotal: _count.guests,
        guestsPage: guestPage,
        guestsLimit: guestLimit,
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get invitation');
  }
}

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

    const data = await parseJsonBody(request, invitationUpdateBodySchema);
    const { invitation } = await updateInvitationForUser(ctx.user.id, id, data);

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Update invitation');
  }
}

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

    const existing = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true },
    });
    if (!existing) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: 'archived', archivedAt: new Date(), publishedAt: null },
    });

    return NextResponse.json({ success: true, archived: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Archive invitation');
  }
}
