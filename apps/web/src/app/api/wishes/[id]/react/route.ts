import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  getClientIp,
  rateLimitResponse,
  RATE_LIMITS,
  checkSameOrigin,
} from '@/lib/shared/api';
import { buildWishLikerHash } from '@/lib/wishes/wish-fingerprint';
import {
  aggregateReactionCounts,
  isWishReactionEmoji,
} from '@/lib/wishes/wish-reactions';

const reactParamsSchema = z.object({
  id: z.string().uuid(),
});

const reactBodySchema = z.object({
  emoji: z.enum(['heart', 'pray', 'celebrate', 'clap'] as const),
});

async function loadReactionSummary(wishId: string, likerHash: string) {
  const rows = await prisma.wishReaction.findMany({
    where: { wishId },
    select: { emoji: true, likerHash: true },
  });
  const mine = rows.find((r) => r.likerHash === likerHash);
  return {
    reactions: aggregateReactionCounts(rows),
    myReaction: mine && isWishReactionEmoji(mine.emoji) ? mine.emoji : null,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const parsedParams = reactParamsSchema.safeParse({ id });
    if (!parsedParams.success) {
      throw new ApiError('validation_error', 'Некорректный id', 400);
    }

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsedBody = reactBodySchema.safeParse(data);
    if (!parsedBody.success) {
      throw new ApiError('validation_error', 'Некорректная реакция', 400);
    }

    const ip = getClientIp(request) || 'unknown';
    const rate = await applyRateLimit(request, `wish_like:${ip}`, RATE_LIMITS.API_WISH_LIKE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const likerHash = buildWishLikerHash(ip, request.headers.get('user-agent'));

    const wish = await prisma.wish.findUnique({
      where: { id: parsedParams.data.id },
      select: {
        id: true,
        invitation: { select: { status: true } },
      },
    });

    if (!wish || wish.invitation.status !== 'published') {
      throw new ApiError('not_found', 'Пожелание не найдено', 404);
    }

    const existing = await prisma.wishReaction.findUnique({
      where: { wishId_likerHash: { wishId: wish.id, likerHash } },
    });

    if (existing) {
      if (existing.emoji !== parsedBody.data.emoji) {
        await prisma.wishReaction.update({
          where: { id: existing.id },
          data: { emoji: parsedBody.data.emoji },
        });
      }
    } else {
      await prisma.wishReaction.create({
        data: {
          wishId: wish.id,
          likerHash,
          emoji: parsedBody.data.emoji,
        },
      });
    }

    const summary = await loadReactionSummary(wish.id, likerHash);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    return apiErrorResponse(error as Error, 'React to wish');
  }
}
