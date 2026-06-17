import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
} from '@/lib/api';
import { addGuests } from '@/services/guests';

const sendInviteSchema = z.object({
  guests: z
    .array(
      z.object({
        name: z.string().min(1, 'Имя обязательно').max(100),
        phone: z.string().max(20).optional(),
        side: z.enum(['bride', 'groom']).optional(),
        hasPlusOne: z.boolean().default(false),
        plusOneName: z.string().max(100).optional(),
      })
    )
    .min(1, 'Добавьте хотя бы одного гостя')
    .max(500, 'Не более 500 гостей за раз'),
});

/**
 * "Send invites" endpoint.
 *
 * Important: this does NOT actually send anything via SMS/WhatsApp. We
 * generate per-guest personal links that the host can then share
 * themselves (we cannot legally or reliably send on their behalf
 * without Twilio/WhatsApp Business API credentials).
 *
 * The name of the endpoint is preserved for backward compatibility
 * with the dashboard UI, but the response explicitly tells the client
 * what we did so the user is not confused.
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

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true, slug: true, status: true },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }
    if (invitation.status !== 'published') {
      throw new ApiError('not_published', 'Сначала опубликуйте приглашение', 400);
    }

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = sendInviteSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const result = await addGuests(id, validation.data.guests);

    const appUrl = process.env.APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const baseUrl = appUrl.replace(/\/$/, '');

    const links = result.guests.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
      inviteUrl: `${baseUrl}/i/${invitation.slug}?guest=${g.token}`,
      whatsappLink: g.phone
        ? `https://wa.me/${g.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            `Сәлеметсіз бе! Сізді тойға шақырамыз: ${baseUrl}/i/${invitation.slug}?guest=${g.token}`
          )}`
        : null,
    }));

    return NextResponse.json({
      success: true,
      // Honest, but politely worded. Lets the UI show a useful message.
      deliveryNote:
        'Ссылки сгенерированы. Отправьте их гостям через WhatsApp/Telegram самостоятельно — автоматическая рассылка пока не подключена.',
      guests: links,
      invitationSlug: invitation.slug,
      stats: {
        created: result.created,
        reused: result.reused,
        skipped: result.skipped,
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Send invites');
  }
}
