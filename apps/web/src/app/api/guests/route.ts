import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/api';
import { addGuests, getGuestStatsForInvitation } from '@/services/guests';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const singleGuestSchema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1, 'Имя обязательно').max(100),
  phone: z.string().max(20).optional(),
  side: z.enum(['bride', 'groom']).optional(),
  hasPlusOne: z.boolean().default(false),
  plusOneName: z.string().max(100).optional(),
});

const batchGuestsSchema = z.object({
  invitationId: z.string().uuid(),
  guests: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        phone: z.string().max(20).optional(),
        side: z.enum(['bride', 'groom']).optional(),
        hasPlusOne: z.boolean().default(false),
        plusOneName: z.string().max(100).optional(),
      })
    )
    .min(1)
    .max(200),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, ctx.user.id, RATE_LIMITS.API_GUEST_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });

    // Dispatch to batch or single.
    if (Array.isArray((data as { guests?: unknown[] })?.guests)) {
      const validation = batchGuestsSchema.safeParse(data);
      if (!validation.success) {
        throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
      }
      const { invitationId, guests } = validation.data;

      const invitation = await prisma.invitation.findFirst({
        where: { id: invitationId, userId: ctx.user.id },
        select: { id: true, status: true },
      });
      if (!invitation) {
        throw new ApiError('not_found', 'Приглашение не найдено', 404);
      }
      if (invitation.status !== 'published') {
        throw new ApiError('not_published', 'Сначала опубликуйте приглашение', 400);
      }

      const result = await addGuests(invitationId, guests);

      return NextResponse.json({
        success: true,
        created: result.created,
        reused: result.reused,
        skipped: result.skipped,
        guests: result.guests,
      });
    }

    const validation = singleGuestSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const { invitationId, ...guestData } = validation.data;
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: ctx.user.id },
      select: { id: true, status: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }
    if (invitation.status !== 'published') {
      throw new ApiError('not_published', 'Сначала опубликуйте приглашение', 400);
    }

    const result = await addGuests(invitationId, [guestData]);
    const only = result.guests[0];
    if (!only) {
      throw new ApiError('server_error', 'Не удалось добавить гостя', 500);
    }
    return NextResponse.json({
      success: true,
      guest: { id: only.id, name: only.name, phone: only.phone, token: only.token },
      created: result.created === 1,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create guest');
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');
    if (!invitationId) {
      throw new ApiError('invitationId_required', 'invitationId обязателен', 400);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const status = searchParams.get('status');

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: ctx.user.id },
      select: { id: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    // The status filter is intentionally narrow: a guest with no
    // response row counts as "pending", and the only way to query for
    // "guests who haven't answered yet" is to combine two queries,
    // which we don't bother doing for the listing page.
    const where: { invitationId: string; response?: { status: 'attending' | 'not_attending' | 'attending_plus_one' | 'pending' } } = { invitationId };
    if (status === 'attending' || status === 'not_attending' || status === 'attending_plus_one' || status === 'pending') {
      where.response = { status };
    }

    const [guests, total, stats] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: { response: true },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.guest.count({ where }),
      getGuestStatsForInvitation(invitationId),
    ]);

    return NextResponse.json({
      guests,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get guests');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    if (!guestId) {
      throw new ApiError('guestId_required', 'guestId обязателен', 400);
    }

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, invitation: { userId: ctx.user.id } },
      select: { id: true },
    });
    if (!guest) {
      throw new ApiError('not_found', 'Гость не найден', 404);
    }

    await prisma.guest.delete({ where: { id: guestId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Delete guest');
  }
}
