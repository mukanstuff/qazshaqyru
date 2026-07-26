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
import { generateGuestToken } from '@/lib/auth';
import { verifyCaptchaToken } from '@/lib/shared/captcha';
import { OPEN_RSVP_MAX_NEW_GUESTS_PER_INVITATION, validateOpenRsvpPhone } from '@/lib/guests/open-rsvp';
import { isEventPast } from '@/lib/shared/event-datetime';

import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import { RSVP_STATUSES, validateRsvpStatus } from '@/lib/guests/rsvp-status';

const openRsvpSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  status: z.enum(RSVP_STATUSES),
  dietaryRestrictions: z.string().max(500).optional(),
  message: z.string().max(1000).optional(),
  website: z.string().max(200).optional(),
  captchaToken: z.string().max(2048).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = openRsvpSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const { slug, name, phone, status, dietaryRestrictions, message, website, captchaToken } =
      validation.data;
    if (website && website.trim().length > 0) {
      return NextResponse.json({
        success: true,
        guest: null,
        response: null,
      });
    }

    const captcha = await verifyCaptchaToken({
      token: captchaToken,
      remoteIp: getClientIp(request),
    });
    if (!captcha.ok) {
      throw new ApiError('captcha_failed', 'Не удалось пройти проверку captcha', 400);
    }

    const phoneCheck = validateOpenRsvpPhone(phone);
    if (!phoneCheck.ok) {
      const msg =
        phoneCheck.code === 'required'
          ? 'Укажите номер телефона для подтверждения'
          : 'Некорректный номер телефона';
      throw new ApiError('invalid_phone', msg, 400);
    }
    const phoneNormalized = phoneCheck.normalized;

    const ip = getClientIp(request) || 'unknown';
    const rate = await applyRateLimit(request, `open_rsvp:${ip}:${slug}`, RATE_LIMITS.API_RSVP);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        eventDate: true,
        eventTime: true,
        eventTimezone: true,
        customText: true,
        eventType: true,
      },
    });

    if (!invitation || invitation.status !== 'published') {
      throw new ApiError('invitation_not_available', 'Приглашение недоступно', 403);
    }

    if (!isOpenRsvpEnabled(invitation.customText, invitation.eventType)) {
      throw new ApiError('open_rsvp_disabled', 'Ответ по общей ссылке отключён для этого приглашения', 403);
    }

    if (
      isEventPast(invitation.eventDate, invitation.eventTime, invitation.eventTimezone)
    ) {
      throw new ApiError('event_passed', 'Мероприятие уже прошло', 410);
    }

    if (!validateRsvpStatus(status, false)) {
      throw new ApiError('invalid_status', 'Недопустимый статус ответа', 400);
    }

    const normalizedName = name.trim().toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      let guest = await tx.guest.findFirst({
        where: { invitationId: invitation.id, phone: phoneNormalized },
      });

      if (guest && guest.name.trim().toLowerCase() !== normalizedName) {
        throw new ApiError(
          'phone_name_mismatch',
          'Этот номер уже зарегистрирован под другим именем. Проверьте данные или свяжитесь с организатором.',
          403
        );
      }

      if (!guest) {
        const guestCount = await tx.guest.count({ where: { invitationId: invitation.id } });
        if (guestCount >= OPEN_RSVP_MAX_NEW_GUESTS_PER_INVITATION) {
          throw new ApiError('guest_limit', 'Достигнут лимит гостей для этого приглашения', 403);
        }

        const { tokenHash } = generateGuestToken();
        guest = await tx.guest.create({
          data: {
            invitationId: invitation.id,
            name,
            phone: phoneNormalized,
            tokenHash,
          },
        });
      }

      const existing = await tx.guestResponse.findUnique({
        where: { guestId: guest.id },
      });

      const response = existing
        ? await tx.guestResponse.update({
            where: { guestId: guest.id },
            data: {
              status,
              dietaryRestrictions: dietaryRestrictions || null,
              message: message || null,
              respondedAt: new Date(),
            },
          })
        : await tx.guestResponse.create({
            data: {
              guestId: guest.id,
              status,
              dietaryRestrictions: dietaryRestrictions || null,
              message: message || null,
            },
          });

      return { guest, response };
    });

    return NextResponse.json({
      success: true,
      guest: { id: result.guest.id, name: result.guest.name },
      response: result.response,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Open RSVP');
  }
}
