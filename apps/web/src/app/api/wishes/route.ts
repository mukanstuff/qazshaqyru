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
import { sanitizeWishAuthorName, sanitizeWishText } from '@/lib/wishes/wish-sanitize';
import { verifyCaptchaToken } from '@/lib/shared/captcha';
import { buildWishLikerHash } from '@/lib/wishes/wish-fingerprint';
import { aggregateReactionCounts, emptyReactionCounts, isWishReactionEmoji } from '@/lib/wishes/wish-reactions';

const WISHES_PER_INVITATION_MAX = 500;

const createWishSchema = z.object({
  slug: z.string().min(1).max(100),
  authorName: z.string().min(1).max(100),
  text: z.string().min(1).max(1000),
  website: z.string().max(200).optional(),
  captchaToken: z.string().max(2048).optional(),
});

const listWishSchema = z.object({
  slug: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listWishSchema.safeParse({ slug: searchParams.get('slug') ?? '' });
    if (!parsed.success) {
      throw new ApiError('validation_error', 'slug обязателен', 400);
    }

    const ip = getClientIp(request) || 'unknown';
    const rate = await applyRateLimit(request, `wish_read:${ip}:${parsed.data.slug}`, RATE_LIMITS.API_WISH_READ);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true, status: true },
    });

    if (!invitation || invitation.status !== 'published') {
      throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
    }

    const likerHash = buildWishLikerHash(ip, request.headers.get('user-agent'));

    const wishes = await prisma.wish.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        authorName: true,
        text: true,
        createdAt: true,
        reactions: {
          select: { emoji: true, likerHash: true },
        },
      },
    });

    type WishReactionRow = { emoji: string; likerHash: string };
    type WishRow = {
      id: string;
      authorName: string;
      text: string;
      createdAt: Date;
      reactions: WishReactionRow[];
    };

    return NextResponse.json({
      wishes: wishes.map((w: WishRow) => {
        const reactions = aggregateReactionCounts(w.reactions);
        const mine = w.reactions.find((r: WishReactionRow) => r.likerHash === likerHash);
        const likeCount = Object.values(reactions).reduce((sum, n) => sum + n, 0);
        return {
          id: w.id,
          authorName: w.authorName,
          text: w.text,
          createdAt: w.createdAt.toISOString(),
          likeCount,
          likedByMe: Boolean(mine),
          reactions,
          myReaction: mine && isWishReactionEmoji(mine.emoji) ? mine.emoji : null,
        };
      }),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'List wishes');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = createWishSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const { slug, authorName, text, website, captchaToken } = validation.data;
    if (website && website.trim().length > 0) {
      return NextResponse.json({
        success: true,
        wish: null,
      });
    }

    const captcha = await verifyCaptchaToken({
      token: captchaToken,
      remoteIp: getClientIp(request),
    });
    if (!captcha.ok) {
      throw new ApiError('captcha_failed', 'Не удалось пройти проверку captcha', 400);
    }

    const cleanName = sanitizeWishAuthorName(authorName);
    const cleanText = sanitizeWishText(text);

    if (!cleanName) {
      throw new ApiError('validation_error', 'Укажите имя', 400);
    }
    if (!cleanText || cleanText.length < 2) {
      throw new ApiError('validation_error', 'Текст пожелания слишком короткий', 400);
    }

    const ip = getClientIp(request) || 'unknown';
    const rate = await applyRateLimit(request, `wish_create:${ip}:${slug}`, RATE_LIMITS.API_WISH_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!invitation || invitation.status !== 'published') {
      throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
    }

    const wishCount = await prisma.wish.count({ where: { invitationId: invitation.id } });
    if (wishCount >= WISHES_PER_INVITATION_MAX) {
      throw new ApiError('wish_limit', 'Достигнут лимит пожеланий', 403);
    }

    const wish = await prisma.wish.create({
      data: {
        invitationId: invitation.id,
        authorName: cleanName,
        text: cleanText,
      },
      select: {
        id: true,
        authorName: true,
        text: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      wish: {
        ...wish,
        createdAt: wish.createdAt.toISOString(),
        likeCount: 0,
        likedByMe: false,
        reactions: emptyReactionCounts(),
        myReaction: null,
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create wish');
  }
}
