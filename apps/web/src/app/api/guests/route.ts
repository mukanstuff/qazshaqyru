import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  applyAuthReadRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import {
  addGuests,
  deleteGuestForUser,
  getGuestStatsForInvitation,
  GuestNotFoundError,
  GuestValidationError,
  updateGuestForUser,
} from '@/lib/guests/service';
import { serializeGuestsForApi } from '@/lib/guests/guest-serialize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const invitationIdSchema = z.string().uuid();

const singleGuestSchema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1, 'Имя обязательно').max(100),
  phone: z.string().max(20).optional(),
  side: z.enum(['bride', 'groom']).optional(),
  hasPlusOne: z.boolean().default(false),
  plusOneName: z.string().max(100).optional(),
  householdLabel: z.string().max(100).optional(),
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
        householdLabel: z.string().max(100).optional(),
      })
    )
    .min(1)
    .max(200),
});

const updateGuestSchema = z.object({
  guestId: z.string().uuid(),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).nullable().optional(),
  side: z.enum(['bride', 'groom']).nullable().optional(),
  hasPlusOne: z.boolean().optional(),
  plusOneName: z.string().max(100).nullable().optional(),
  householdLabel: z.string().max(100).nullable().optional(),
});

type GuestResponseStatusFilter =
  | 'attending'
  | 'not_attending'
  | 'attending_plus_one'
  | 'attending_no_children'
  | 'pending';

/** Build Prisma where with correct 1:1 relation filters (`is` / `isNot`). */
export function buildGuestListWhere(
  invitationId: string,
  status: string | null
): Prisma.GuestWhereInput {
  const where: Prisma.GuestWhereInput = { invitationId };

  if (
    status === 'attending' ||
    status === 'not_attending' ||
    status === 'attending_plus_one' ||
    status === 'attending_no_children'
  ) {
    where.response = { is: { status: status as Exclude<GuestResponseStatusFilter, 'pending'> } };
    return where;
  }

  if (status === 'pending') {
    where.OR = [
      { response: { is: null } },
      { response: { is: { status: 'pending' } } },
    ];
  }

  return where;
}

export async function PATCH(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = updateGuestSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const { updated } = await updateGuestForUser({
      ...validation.data,
      userId: ctx.user.id,
    });

    return NextResponse.json({ success: true, guest: updated });
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return apiErrorResponse(new ApiError('invalid_phone', error.message, 400), 'Update guest');
    }
    if (error instanceof GuestNotFoundError) {
      return apiErrorResponse(new ApiError('not_found', error.message, 404), 'Update guest');
    }
    return apiErrorResponse(error as Error, 'Update guest');
  }
}

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
    if (error instanceof GuestValidationError) {
      return apiErrorResponse(new ApiError('invalid_phone', error.message, 400), 'Create guest');
    }
    return apiErrorResponse(error as Error, 'Create guest');
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const readRate = await applyAuthReadRateLimit(request, ctx.user.id);
    if (!readRate.allowed) return rateLimitResponse(readRate);

    const { searchParams } = new URL(request.url);
    const invitationIdRaw = searchParams.get('invitationId');
    if (!invitationIdRaw) {
      throw new ApiError('invitationId_required', 'invitationId обязателен', 400);
    }
    const invitationIdParsed = invitationIdSchema.safeParse(invitationIdRaw);
    if (!invitationIdParsed.success) {
      throw new ApiError('invalid_invitationId', 'invitationId должен быть UUID', 400);
    }
    const invitationId = invitationIdParsed.data;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const status = searchParams.get('status');

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: ctx.user.id },
      select: { id: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const where = buildGuestListWhere(invitationId, status);

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
      guests: serializeGuestsForApi(guests),
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

    await deleteGuestForUser(guestId, ctx.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof GuestNotFoundError) {
      return apiErrorResponse(new ApiError('not_found', error.message, 404), 'Delete guest');
    }
    return apiErrorResponse(error as Error, 'Delete guest');
  }
}
