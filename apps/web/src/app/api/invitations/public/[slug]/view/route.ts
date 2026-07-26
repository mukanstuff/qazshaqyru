import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';

/** Increment public invitation view counter (best-effort, rate-limited). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (slug === 'demo') {
      return NextResponse.json({ success: true, viewCount: 0 });
    }

    const rate = await applyRateLimit(request, `view:${slug}`, RATE_LIMITS.PUBLIC_INVITATION);
    if (!rate.allowed) return rateLimitResponse(rate);

    const updated = await prisma.invitation.updateMany({
      where: { slug, status: 'published' },
      data: { viewCount: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: { viewCount: true },
    });

    return NextResponse.json({
      success: true,
      viewCount: invitation?.viewCount ?? 0,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Track invitation view');
  }
}
