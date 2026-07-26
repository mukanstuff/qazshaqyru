import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  checkSameOrigin,
  getClientIp,
} from '@/lib/shared/api';
import { hashToken } from '@/lib/auth';
import { verifyCaptchaToken } from '@/lib/shared/captcha';
import { isEventPast } from '@/lib/shared/event-datetime';
import { validateRsvpStatus, RSVP_STATUSES } from '@/lib/guests/rsvp-status';

const rsvpSchema = z.object({
  guestToken: z.string().min(16).max(128),
  status: z.enum(RSVP_STATUSES),
  dietaryRestrictions: z.string().max(500).optional(),
  message: z.string().max(1000).optional(),
  website: z.string().max(200).optional(),
  captchaToken: z.string().max(2048).optional(),
});

const rsvpGetSchema = z.object({
  guestToken: z.string().min(16).max(128),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = rsvpSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const { guestToken, status, dietaryRestrictions, message, website, captchaToken } = validation.data;
    if (website && website.trim().length > 0) {
      return NextResponse.json({ success: true, response: null });
    }

    const captcha = await verifyCaptchaToken({
      token: captchaToken,
      remoteIp: getClientIp(request),
    });
    if (!captcha.ok) {
      throw new ApiError('captcha_failed', 'Не удалось пройти проверку captcha', 400);
    }

    // Rate-limit on the *hash* so a leaked URL doesn't burn the bucket.
    const rate = await applyRateLimit(request, hashToken(guestToken), RATE_LIMITS.API_RSVP);
    if (!rate.allowed) return rateLimitResponse(rate);

    const tokenHash = hashToken(guestToken);
    const guest = await prisma.guest.findUnique({
      where: { tokenHash },
      include: {
        invitation: {
          select: {
            status: true,
            eventDate: true,
            eventTime: true,
            eventTimezone: true,
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!guest) {
      throw new ApiError('guest_not_found', 'Гость не найден', 404);
    }

    if (guest.invitation.status !== 'published') {
      throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
    }

    if (
      isEventPast(
        guest.invitation.eventDate,
        guest.invitation.eventTime,
        guest.invitation.eventTimezone
      )
    ) {
      throw new ApiError('event_passed', 'Мероприятие уже прошло', 410);
    }

    if (!validateRsvpStatus(status, guest.hasPlusOne)) {
      throw new ApiError('invalid_status', 'Недопустимый статус ответа', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.guestResponse.findUnique({
        where: { guestId: guest.id },
      });

      if (existing) {
        return tx.guestResponse.update({
          where: { guestId: guest.id },
          data: {
            status,
            dietaryRestrictions: dietaryRestrictions || null,
            message: message || null,
            respondedAt: new Date(),
          },
        });
      }
      return tx.guestResponse.create({
        data: {
          guestId: guest.id,
          status,
          dietaryRestrictions: dietaryRestrictions || null,
          message: message || null,
        },
      });
    });

    return NextResponse.json({ success: true, response: result });
  } catch (error) {
    return apiErrorResponse(error as Error, 'RSVP');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = rsvpGetSchema.safeParse({ guestToken: searchParams.get('guestToken') ?? '' });
    if (!parsed.success) {
      throw new ApiError('validation_error', 'guestToken обязателен', 400);
    }

    const rate = await applyRateLimit(
      request,
      `rsvp_get:${hashToken(parsed.data.guestToken)}`,
      RATE_LIMITS.API_RSVP,
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const tokenHash = hashToken(parsed.data.guestToken);
    const guest = await prisma.guest.findUnique({
      where: { tokenHash },
      include: {
        response: true,
        seating: { include: { table: { select: { name: true } } } },
        invitation: {
          select: {
            title: true,
            slug: true,
            eventDate: true,
            eventTime: true,
            eventPlace: true,
            eventTimezone: true,
            status: true,
            customText: true,
            templateKey: true,
            user: { select: { language: true, name: true } },
          },
        },
      },
    });

    if (!guest) {
      throw new ApiError('not_found', 'Гость не найден', 404);
    }

    if (guest.invitation.status !== 'published') {
      throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
    }

    if (
      isEventPast(
        guest.invitation.eventDate,
        guest.invitation.eventTime,
        guest.invitation.eventTimezone
      )
    ) {
      throw new ApiError('event_passed', 'Мероприятие уже прошло', 410);
    }

    // Mark personal link opened (guest ops funnel) — fire-and-forget.
    if (!guest.openedAt) {
      void prisma.guest
        .update({ where: { id: guest.id }, data: { openedAt: new Date() } })
        .catch(() => undefined);
    }

    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        hasPlusOne: guest.hasPlusOne,
        plusOneName: guest.plusOneName,
        seatingTableName: guest.seating?.table.name ?? null,
        // We deliberately do NOT echo the token back. The client got it
        // from the URL; re-sending it would be a copy-paste surface.
      },
      invitation: {
        title: guest.invitation.title,
        slug: guest.invitation.slug,
        eventDate: guest.invitation.eventDate.toISOString(),
        eventTime: guest.invitation.eventTime,
        eventPlace: guest.invitation.eventPlace,
        eventTimezone: guest.invitation.eventTimezone,
        language: guest.invitation.user.language,
        hostName: guest.invitation.user.name,
        isActive: guest.invitation.status === 'published',
        customText: guest.invitation.customText,
        templateKey: guest.invitation.templateKey,
      },
      response: guest.response,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get RSVP');
  }
}
