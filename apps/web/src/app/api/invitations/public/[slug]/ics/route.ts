import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { buildIcsContent } from '@/lib/guests/calendar-ics';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { slug } = await params;
  try {
    const inv = await prisma.invitation.findFirst({
      where: { slug, status: 'published' },
      select: {
        title: true,
        eventDate: true,
        eventTime: true,
        eventTimezone: true,
        eventPlace: true,
        address: true,
        slug: true,
      },
    });

    if (!inv) {
      return new Response('Not found', { status: 404 });
    }

    const icsContent = buildIcsContent({
      title: inv.title,
      eventDate: inv.eventDate,
      eventTime: inv.eventTime,
      eventTimezone: inv.eventTimezone,
      eventPlace: inv.eventPlace,
      address: inv.address,
      slug: inv.slug,
      appUrl: req.nextUrl.origin,
    });

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="invitation-${slug}.ics"`,
      },
    });
  } catch {
    return new Response('Error generating ICS', { status: 500 });
  }
}
