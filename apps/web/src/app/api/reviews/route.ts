import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  getCurrentSession,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { MIN_REVIEWS_TO_SHOW } from '@/lib/reviews/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Service reviews — written by real, signed-in customers about their own
 * invitation.
 *
 * The landing has no social proof at all, and the obvious shortcut — writing
 * plausible testimonials, or generating screenshots of them — is the one thing
 * this codebase has already been cleaned of once. So the proof has to be
 * collected rather than authored, which means the collection path has to exist
 * before the first customer, not after.
 *
 * Three rules make the result trustworthy:
 *  - only a signed-in owner of the invitation may review it, so a review always
 *    has a real account behind it;
 *  - one review per invitation, enforced by a unique index, so nobody can pad
 *    the wall;
 *  - low ratings are stored like any other. An average is worth showing only if
 *    it could have come out badly.
 */

const createSchema = z.object({
  invitationId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(1000),
  authorName: z.string().trim().min(2).max(80),
});

export async function GET() {
  try {
    const reviews = await prisma.serviceReview.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, rating: true, text: true, authorName: true, createdAt: true },
    });

    const aggregate = await prisma.serviceReview.aggregate({
      where: { approved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const count = aggregate._count._all;
    return NextResponse.json({
      // The client is told outright whether there is enough to show, so the
      // threshold lives in one place instead of being re-guessed in the UI.
      enough: count >= MIN_REVIEWS_TO_SHOW,
      count,
      average: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
      reviews: count >= MIN_REVIEWS_TO_SHOW ? reviews : [],
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'List reviews');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const session = await getCurrentSession();
    if (!session) {
      throw new ApiError('unauthorized', 'Требуется вход', 401);
    }

    const rate = await applyRateLimit(request, `review:${session.session.userId}`, RATE_LIMITS.API_WISH_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const raw = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const { invitationId, rating, text, authorName } = parsed.data;

    // Ownership is checked against the session rather than trusted from the
    // body: otherwise anyone could review any invitation by guessing an id.
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: session.session.userId },
      select: { id: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const review = await prisma.serviceReview.upsert({
      where: { userId_invitationId: { userId: session.session.userId, invitationId } },
      create: { userId: session.session.userId, invitationId, rating, text, authorName },
      // Editing your own review replaces it and sends it back for moderation —
      // otherwise an approved review could be rewritten into anything.
      update: { rating, text, authorName, approved: false },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: review.id, pending: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create review');
  }
}
