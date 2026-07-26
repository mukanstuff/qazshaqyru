import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { computeGuestAnalytics } from '@/lib/guests/guest-analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();

    const rate = await applyRateLimit(request, `analytics:${ctx.user.id}`, RATE_LIMITS.API_AUTH_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const guests = await prisma.guest.findMany({
      where: { invitationId: id },
      select: { response: { select: { status: true } } },
    });

    return NextResponse.json({ analytics: computeGuestAnalytics(guests) });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Guest analytics');
  }
}
