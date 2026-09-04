import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getCurrentSession,
} from '@/lib/shared/api';

const SEEN_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h — long enough that a guest re-opening
// the link later that day doesn't inflate the count, short enough that this
// isn't tracking anyone long-term.

/**
 * Increment public invitation view counter (best-effort, rate-limited).
 *
 * This number is shown to the owner as guest interest, so it has to mean
 * roughly what it claims to: distinct visits from people who aren't the
 * owner. Two things used to make it meaningless:
 *  - The owner's own visits (checking their invitation looks right) counted
 *    the same as a guest's.
 *  - Reloading the page counted again every time — no dedup at all, and
 *    separately, CanvasGuestPage fired a second, independent increment
 *    (POST /api/invitations/[id]/event) on every canvas load, so a single
 *    real visit was usually already being counted twice before a reload.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (slug === 'demo') {
      return NextResponse.json({ success: true, viewCount: 0, counted: false });
    }

    const rate = await applyRateLimit(request, `view:${slug}`, RATE_LIMITS.PUBLIC_INVITATION);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: { id: true, userId: true, status: true, viewCount: true },
    });
    if (!invitation || invitation.status !== 'published') {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const session = await getCurrentSession();
    const isOwner = session?.user.id === invitation.userId;

    const seenCookieName = `qs_seen_${invitation.id}`;
    const alreadySeen = request.cookies.get(seenCookieName) != null;

    let viewCount = invitation.viewCount;
    let counted = false;

    if (!isOwner && !alreadySeen) {
      const updated = await prisma.invitation.update({
        where: { id: invitation.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
      viewCount = updated.viewCount;
      counted = true;
    }

    const response = NextResponse.json({ success: true, viewCount, counted });
    if (counted) {
      response.cookies.set(seenCookieName, '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SEEN_COOKIE_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    return apiErrorResponse(error as Error, 'Track invitation view');
  }
}
