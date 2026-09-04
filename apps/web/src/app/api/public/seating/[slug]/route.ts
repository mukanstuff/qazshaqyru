import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';
import { hashToken } from '@/lib/auth';
import { isEventPast } from '@/lib/shared/event-datetime';
import {
  clampTablePosition,
  clampTableSize,
  DEFAULT_TABLE,
  normalizeTableShape,
} from '@/lib/guests/seating-layout';

type PublicTableRow = {
  id: string;
  name: string;
  capacity: number;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  rotation: number | null;
  shape: string | null;
  tableColor: string | null;
  assignments: Array<{ guest: { id: string; name: string } }>;
};

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
  // Coordinates are in the shared HALL_W × HALL_H space (see seating-layout.ts).
  tables: [
    { id: 't1', name: '1', capacity: 8, assignedCount: 3, x: 120, y: 120, w: 140, h: 140, rotation: 0, shape: 'round', tableColor: '#16a34a', guests: [
      { id: 'g1', name: 'Асхат' },
      { id: 'g2', name: 'Айгуль' },
      { id: 'g3', name: 'Бекзат' },
    ] },
    { id: 't2', name: '2', capacity: 8, assignedCount: 2, x: 520, y: 120, w: 140, h: 140, rotation: 0, shape: 'round', tableColor: '#16a34a', guests: [
      { id: 'g4', name: 'Диас' },
      { id: 'g5', name: 'Камила' },
    ] },
    { id: 't3', name: '3', capacity: 10, x: 120, y: 460, assignedCount: 3, w: 140, h: 140, rotation: 0, shape: 'round', tableColor: '#16a34a', guests: [
      { id: 'g6', name: 'Марат' },
      { id: 'g7', name: 'Жанар' },
      { id: 'g8', name: 'Тимур' },
    ] },
    { id: 't4', name: '4', capacity: 10, assignedCount: 1, x: 520, y: 460, w: 260, h: 140, rotation: 0, shape: 'rect', tableColor: '#0ea5e9', guests: [
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
      // NOTE: this used to read `t.color` and `t.assignedCount`. Neither column
      // exists on SeatingTable (the fields are `tableColor`, and the count comes
      // from `assignments`), so every table silently fell back to the hardcoded
      // green and the owner's chosen colour never reached guests.
      tables: tables.map((t: PublicTableRow) => {
        const w = clampTableSize(t.w, DEFAULT_TABLE.w);
        const h = clampTableSize(t.h, DEFAULT_TABLE.h);
        const { x, y } = clampTablePosition(t.x, t.y, w, h);
        return {
          id: t.id,
          name: t.name,
          capacity: t.capacity,
          assignedCount: t.assignments.length,
          x,
          y,
          w,
          h,
          rotation: t.rotation ?? 0,
          shape: normalizeTableShape(t.shape),
          tableColor: t.tableColor ?? DEFAULT_TABLE.color,
          guests: t.assignments.map((a) => ({ id: a.guest.id, name: a.guest.name })),
        };
      }),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Public seating');
  }
}
