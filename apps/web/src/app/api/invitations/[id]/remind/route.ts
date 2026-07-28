import { NextRequest, NextResponse } from 'next/server';
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
import { issueGuestInviteLinks } from '@/lib/guests/service';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import {
  buildGuestReminderLinks,
  filterReminderGuests,
  type ReminderGuestInput,
} from '@/lib/guests/guest-reminders';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

/**
 * Build WhatsApp deep links for guests who have not confirmed attendance.
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

    const rate = await applyRateLimit(request, `remind:${ctx.user.id}`, RATE_LIMITS.API_INVITATION_SEND);
    if (!rate.allowed) return rateLimitResponse(rate);

    const pricing = await getInvitationPricing(id, ctx.user.id);
    if (!pricing) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }
    if (!pricing.entitlements.reminders) {
      throw new ApiError(
        'plan_required',
        'Напоминания доступны на тарифе Стандарт и выше',
        402
      );
    }

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        eventType: true,
        customText: true,
        user: { select: { language: true } },
      },
    });
    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }
    if (invitation.status !== 'published') {
      throw new ApiError('not_published', 'Сначала опубликуйте приглашение', 400);
    }

    const guestRows = await prisma.guest.findMany({
      where: { invitationId: id },
      select: {
        id: true,
        name: true,
        phone: true,
        response: { select: { status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (guestRows.length === 0) {
      throw new ApiError('no_guests', 'Добавьте хотя бы одного гостя', 400);
    }

    type RemindGuestRow = {
      id: string;
      name: string;
      phone: string;
      response?: { status: string } | null;
    };

    const reminderInputs: ReminderGuestInput[] = guestRows.map((g: RemindGuestRow) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
      responseStatus: g.response?.status ?? null,
    }));

    const targets = filterReminderGuests(reminderInputs);
    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        guests: [],
        stats: { total: 0, withPhone: 0 },
        message: 'Все гости уже подтвердили участие',
      });
    }

    const issued = await issueGuestInviteLinks(
      id,
      targets.map((g) => g.id),
      { reissue: true }
    );

    const appUrl = process.env.APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const baseUrl = appUrl.replace(/\/$/, '');
    const guestLang = invitation.user.language === 'kz' ? 'kz' : 'ru';
    const openRsvp = isOpenRsvpEnabled(invitation.customText, invitation.eventType);

    const links = buildGuestReminderLinks({
      guests: issued.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        token: g.token,
      })),
      slug: invitation.slug,
      title: invitation.title,
      baseUrl,
      locale: guestLang,
      openRsvp,
    });

    const withPhone = links.filter((l) => l.whatsappLink).length;

    return NextResponse.json({
      success: true,
      guests: links,
      invitationSlug: invitation.slug,
      stats: { total: links.length, withPhone },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Remind guests');
  }
}
