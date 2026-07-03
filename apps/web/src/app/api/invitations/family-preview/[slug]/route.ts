import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/api';
import { isEventPast } from '@/lib/event-datetime';
import { verifyPreviewToken } from '@/lib/preview-token';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/** Read-only draft preview for family (before payment). Requires ?preview= */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const previewToken = request.nextUrl.searchParams.get('preview');

    const rate = await applyRateLimit(request, `family_preview_read:${slug}`, RATE_LIMITS.PUBLIC_INVITATION);
    if (!rate.allowed) return rateLimitResponse(rate);

    if (!previewToken) {
      throw new ApiError('forbidden', 'Требуется токен предпросмотра', 403);
    }

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: {
        user: { select: { language: true, name: true } },
        template: { select: { nameRu: true, nameKz: true, slug: true, config: true } },
        _count: { select: { guests: true } },
      },
    });

    if (!invitation || invitation.status === 'archived') {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    if (invitation.status === 'published') {
      throw new ApiError('invalid_state', 'Используйте публичную ссылку', 400);
    }

    if (!verifyPreviewToken(previewToken, invitation.previewTokenHash)) {
      throw new ApiError('forbidden', 'Недействительная ссылка предпросмотра', 403);
    }

    const customText = invitation.customText as Record<string, unknown> | null;
    const openRsvp = false;
    const localeFromCustom = customText?.invitationLocale;
    const invitationLanguage =
      localeFromCustom === 'kz' || localeFromCustom === 'ru'
        ? localeFromCustom
        : invitation.user.language;

    const safeInvitation = {
      slug: invitation.slug,
      title: invitation.title,
      eventType: invitation.eventType,
      eventDate: invitation.eventDate.toISOString(),
      eventTime: invitation.eventTime,
      eventPlace: invitation.eventPlace,
      eventTimezone: invitation.eventTimezone,
      templateKey: invitation.templateKey,
      templateData: invitation.templateData,
      musicUrl: invitation.musicUrl,
      mapUrl: invitation.mapUrl,
      address: invitation.address,
      customText: invitation.customText,
      openRsvp,
      language: invitationLanguage,
      hostName: invitation.user.name,
      isPast: isEventPast(
        invitation.eventDate,
        invitation.eventTime,
        invitation.eventTimezone,
      ),
      guestCount: invitation._count.guests,
      familyPreview: true,
    };

    return NextResponse.json({ invitation: safeInvitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Family preview invitation');
  }
}
