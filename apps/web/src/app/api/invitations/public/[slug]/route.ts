import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiErrorResponse } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: {
        user: { select: { language: true, name: true } },
        template: { select: { nameRu: true, nameKz: true, slug: true, config: true } },
        _count: { select: { guests: true } },
      },
    });

    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    if (invitation.status !== 'published' && invitation.status !== 'archived') {
      throw new ApiError('not_published', 'Приглашение ещё не опубликовано', 403);
    }

    const isPast = invitation.eventDate < new Date();

    const safeInvitation = {
      id: invitation.id,
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
      language: invitation.user.language,
      hostName: invitation.user.name,
      isPast,
      guestCount: invitation._count.guests,
    };

    return NextResponse.json({ invitation: safeInvitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get public invitation');
  }
}
