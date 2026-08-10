import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';
import { hashToken } from '@/lib/auth';
import { isEventPast } from '@/lib/shared/event-datetime';

const DEMO_SEATING = {
  invitation: {
    id: 'demo',
    slug: 'demo',
    title: 'Айгерим & Нурлан',
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    eventTime: '17:00',
    eventTimezone: 'Asia/Almaty',
    isPast: false,
  },
  tables: [
    { id: 't1', name: '1', capacity: 8, x: 60, y: 80, w: 120, h: 120, rotation: 0, shape: 'round', tableColor: '#10b981', guests: [
      { id: 'g1', name: 'Асхат' },
      { id: 'g2', name: 'Айгуль' },
      { id: 'g3', name: 'Бекзат' },
    ] },
    { id: 't2', name: '2', capacity: 8, x: 320, y: 80, w: 120, h: 120, rotation: 0, shape: 'round', tableColor: '#10b981', guests: [
      { id: 'g4', name: 'Диас' },
      { id: 'g5', name: 'Камила' },
    ] },
    { id: 't3', name: '3', capacity: 10, x: 60, y: 320, w: 120, h: 120, rotation: 0, shape: 'round', tableColor: '#10b981', guests: [
      { id: 'g6', name: 'Марат' },
      { id: 'g7', name: 'Жанар' },
      { id: 'g8', name: 'Тимур' },
    ] },
    { id: 't4', name: '4', capacity: 10, x: 320, y: 320, w: 120, h: 120, rotation: 0, shape: 'round', tableColor: '#10b981', guests: [
      { id: 'g9', name: 'Самал' },
    ] },
  ],
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const guestToken = request.nextUrl.searchParams.get('guestToken')?.trim();

    const rate = await applyRateLimit(
      request,
      `public_seating:${slug}`,
      RATE_LIMITS.API_RSVP
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    // Demo invitation is mocked (not in DB) — return canned seating.
    if (slug === 'demo') {
      return NextResponse.json({
        ...DEMO_SEATING,
        highlightGuestId: guestToken ? 'g1' : null,
      });
    }

    const invitation = await prisma.invitation.findFirst({
      where: { slug, status: 'published' },
      select: {
        id: true,
        slug: true,
        title: true,
        eventDate: true,
        eventTime: true,
        eventTimezone: true,
      },
    });

    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    let highlightGuestId: string | null = null;
    if (guestToken && guestToken.length >= 16) {
      const guest = await prisma.guest.findUnique({
        where: { tokenHash: hashToken(guestToken) },
        select: { id: true, invitationId: true, name: true },
      });
      if (guest && guest.invitationId === invitation.id) {
        highlightGuestId = guest.id;
      }
    }

    const tables = await prisma.seatingTable.findMany({
      where: { invitationId: invitation.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        assignments: {
          select: {
            guestId: true,
            guest: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        slug: invitation.slug,
        title: invitation.title,
        eventDate: invitation.eventDate,
        eventTime: invitation.eventTime,
        eventTimezone: invitation.eventTimezone,
        isPast: isEventPast(
          invitation.eventDate,
          invitation.eventTime,
          invitation.eventTimezone
        ),
      },
      highlightGuestId,
      tables: tables.map((t: { id: string; name: string; capacity: number; x: number; y: number; w: number; h: number; rotation: number; shape: string; color: string | null; assignedCount?: number; assignments: Array<{ guest: { id: string; name: string } }> }) => ({
        id: t.id,
        name: t.name,
        capacity: t.capacity,
        assignedCount: t.assignedCount ?? t.assignments.length,
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
        rotation: t.rotation,
        shape: t.shape ?? 'round',
        tableColor: t.color ?? '#10b981',
        guests: t.assignments.map((a: { guest: { id: string; name: string } }) => ({ id: a.guest.id, name: a.guest.name })),
      })),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Public seating');
  }
}
