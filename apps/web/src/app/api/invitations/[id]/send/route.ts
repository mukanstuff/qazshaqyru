import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { issueGuestInviteLinks, buildWhatsAppLink } from '@/lib/guests/service';

const sendInviteSchema = z.object({
  /** Optional subset of guest IDs; if omitted, all guests are included. */
  guestIds: z.array(z.string().uuid()).max(500).optional(),
  /** Rotate tokens for guests who were already sent links. */
  reissue: z.boolean().optional(),
});

/**
 * Generate per-guest personal links for the host to share via WhatsApp/Telegram.
 * Sets sentAt so reopening the editor does not invalidate existing links.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const sendRate = await applyRateLimit(request, `send:${ctx.user.id}`, RATE_LIMITS.API_INVITATION_SEND);
    if (!sendRate.allowed) return rateLimitResponse(sendRate);

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true, slug: true, title: true, status: true, user: { select: { language: true } } },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }
    if (invitation.status !== 'published') {
      throw new ApiError('not_published', 'Сначала опубликуйте приглашение', 400);
    }

    const guestCount = await prisma.guest.count({ where: { invitationId: id } });
    if (guestCount === 0) {
      throw new ApiError('no_guests', 'Добавьте хотя бы одного гостя', 400);
    }

    const data = await request.json().catch(() => ({}));
    const validation = sendInviteSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const guestIds = validation.data.guestIds;
    const issued = await issueGuestInviteLinks(
      id,
      guestIds?.length ? guestIds : undefined,
      { reissue: validation.data.reissue ?? false }
    );

    const appUrl = process.env.APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const baseUrl = appUrl.replace(/\/$/, '');

    const guestLang = invitation.user.language === 'kz' ? 'kz' : 'ru';
    const whatsappTexts: Record<string, string> = {
      ru: `Вас приглашают: ${invitation.title}!\n`,
      kz: `Сізді шақырамыз: ${invitation.title}!\n`,
    };
    const baseMsg = whatsappTexts[guestLang] ?? whatsappTexts.ru;

    const links = issued.map((g) => {
      const inviteUrl = g.token
        ? `${baseUrl}/i/${invitation.slug}?guest=${g.token}`
        : `${baseUrl}/i/${invitation.slug}`;
      return {
        id: g.id,
        name: g.name,
        phone: g.phone,
        inviteUrl,
        alreadySent: g.alreadySent,
        whatsappLink:
          g.phone && g.token
            ? buildWhatsAppLink(g.phone, `${baseMsg}${inviteUrl}`)
            : null,
      };
    });

    const newlyIssued = links.filter((l) => !l.alreadySent).length;

    return NextResponse.json({
      success: true,
      deliveryNote:
        newlyIssued > 0
          ? 'Ссылки готовы. Отправьте их гостям через WhatsApp или Telegram.'
          : 'Все ссылки уже были отправлены ранее. Повторная отправка не меняет старые ссылки.',
      guests: links,
      invitationSlug: invitation.slug,
      stats: { issued: newlyIssued, total: links.length },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Send invites');
  }
}
