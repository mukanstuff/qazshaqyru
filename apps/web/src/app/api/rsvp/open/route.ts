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
  phone: z.string().max(20).optional(),
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
      throw new ApiError('invalid_phone', 'Некорректный номер телефона', 400);
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

    /*
     * Open RSVP is how a guest registers themselves from the public page (no
     * personal link). `hasPlusOne` normally comes from the owner's guest list,
     * so this route hardcoded `false` here — which rejected
     * `attending_plus_one` outright. The guest form worked around that by
     * silently downgrading "Приду с гостем" to plain "Приду" before sending, so
     * a guest who said they were bringing someone was recorded as one person
     * and the тойхана headcount — the thing this product is sold on — came out
     * short. Someone answering "+1" here IS declaring a plus-one; take them at
     * their word and record it. The owner can still edit the guest afterwards.
     */
    const wantsPlusOne = status === 'attending_plus_one';
    if (!validateRsvpStatus(status, wantsPlusOne)) {
      throw new ApiError('invalid_status', 'Недопустимый статус ответа', 400);
    }

    const normalizedName = name.trim().toLowerCase();

    type PrismaTx = any;
    const result = await prisma.$transaction(async (tx: PrismaTx) => {
      // Serialize concurrent open-RSVP submissions for this invitation so the
      // guest-count check below can't race: without this, two requests can
      // both read a count just under OPEN_RSVP_MAX_NEW_GUESTS_PER_INVITATION
      // and both insert, pushing the invitation past the cap. The lock is
      // transaction-scoped (auto-released on commit/rollback) and keyed per
      // invitation, so it doesn't serialize unrelated invitations.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${invitation.id}))`;

      /*
       * Identity without a number.
       *
       * The phone was what this route deduped on, and it is no longer required
       * — so a guest who leaves it blank is matched by name instead. Name
       * matching is weaker: two Айгүл in one guest list collapse into one row.
       * That is the accepted cost of not demanding a phone number from someone
       * who only wants to say they are coming; a guest who does give one is
       * still matched exactly.
       */
      let guest = phoneNormalized
        ? await tx.guest.findFirst({
            where: { invitationId: invitation.id, phone: phoneNormalized },
          })
        : await tx.guest.findFirst({
            where: {
              invitationId: invitation.id,
              phone: null,
              name: { equals: name.trim(), mode: 'insensitive' },
            },
          });

      if (guest && phoneNormalized && guest.name.trim().toLowerCase() !== normalizedName) {
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
            hasPlusOne: wantsPlusOne,
          },
        });
      } else if (guest.hasPlusOne !== wantsPlusOne) {
        // Someone re-answering can add or drop their companion; the seat count
        // has to follow, otherwise a corrected answer never reaches the venue.
        guest = await tx.guest.update({
          where: { id: guest.id },
          data: { hasPlusOne: wantsPlusOne },
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
