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
  requireAuth,
} from '@/lib/shared/api';
import { hashToken } from '@/lib/auth';
import {
  buildGiftFingerprint,
  sanitizeGiftAuthorName,
  sanitizeGiftNote,
} from '@/lib/gifts/gift-transfer';

const createSchema = z.object({
  slug: z.string().min(1).max(100),
  authorName: z.string().min(1).max(100),
  note: z.string().max(300).optional(),
  guestToken: z.string().min(16).max(128).optional(),
});

const listSchema = z.object({
  slug: z.string().min(1).max(100),
});

/** Public: guest marks that they transferred a Kaspi gift (honor system). */
export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const ip = getClientIp(request) || 'unknown';
    const rate = await applyRateLimit(
      request,
      `gift_create:${ip}:${parsed.data.slug}`,
      RATE_LIMITS.API_GIFT_CREATE
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true, status: true, customText: true },
    });
    if (!invitation || invitation.status !== 'published') {
      throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
    }

    const customText = invitation.customText as Record<string, unknown> | null;
    const kaspiPhone = typeof customText?.kaspiPhone === 'string' ? customText.kaspiPhone : '';
    if (!kaspiPhone.trim()) {
      throw new ApiError('kaspi_not_configured', 'Kaspi номер не указан', 400);
    }

    let guestId: string | null = null;
    if (parsed.data.guestToken) {
      const guest = await prisma.guest.findUnique({
        where: { tokenHash: hashToken(parsed.data.guestToken) },
        select: { id: true, invitationId: true },
      });
      if (guest && guest.invitationId === invitation.id) {
        guestId = guest.id;
      }
    }

    const fingerprintHash = buildGiftFingerprint(ip, request.headers.get('user-agent'));
    const authorName = sanitizeGiftAuthorName(parsed.data.authorName);
    const note = sanitizeGiftNote(parsed.data.note);

    try {
      const transfer = await prisma.giftTransfer.create({
        data: {
          invitationId: invitation.id,
          guestId,
          authorName,
          note,
          fingerprintHash,
        },
        select: { id: true, authorName: true, createdAt: true },
      });

      return NextResponse.json({
        transfer: {
          id: transfer.id,
          authorName: transfer.authorName,
          createdAt: transfer.createdAt.toISOString(),
        },
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') {
        return NextResponse.json({ alreadyMarked: true });
      }
      throw err;
    }
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create gift transfer');
  }
}

/** Host: list gift transfer acknowledgments for an invitation (by slug query + auth). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');
    if (!invitationId) {
      const parsed = listSchema.safeParse({ slug: searchParams.get('slug') ?? '' });
      if (!parsed.success) {
        throw new ApiError('validation_error', 'invitationId или slug обязателен', 400);
      }
      // Public count only
      const invitation = await prisma.invitation.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true, status: true },
      });
      if (!invitation || invitation.status !== 'published') {
        throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
      }
      const count = await prisma.giftTransfer.count({ where: { invitationId: invitation.id } });
      return NextResponse.json({ count });
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(
      request,
      `gift_host:${ctx.user.id}`,
      RATE_LIMITS.API_AUTH_READ
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: ctx.user.id },
      select: { id: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const transfers = await prisma.giftTransfer.findMany({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        authorName: true,
        note: true,
        createdAt: true,
        guest: { select: { id: true, name: true } },
      },
    });

    type GiftTransferRow = {
      id: string;
      authorName: string | null;
      note: string | null;
      guest?: { name: string } | null;
      createdAt: Date;
    };
    return NextResponse.json({
      transfers: transfers.map((t: GiftTransferRow) => ({
        id: t.id,
        authorName: t.authorName,
        note: t.note,
        guestName: t.guest?.name ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'List gift transfers');
  }
}
