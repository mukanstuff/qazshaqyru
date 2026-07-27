/**
 * Public API: fetch the canvas document + invitation data needed by the
 * guest page. Returns `canvas: null` for invitations still on the legacy
 * section engine — the client falls back to InvitationLayoutRouter.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  try {
    // Canvas column is typed as `Json?` in Prisma. When the migration hasn't
    // been applied yet this query will 500; the client already treats errors
    // as "use legacy renderer" so no try/catch fallback is needed — but we
    // still need this to degrade gracefully during the migration window.
    const inv = await (prisma as unknown as {
      invitation: {
        findUnique: (args: {
          where: { slug: string };
          select: Record<string, boolean>;
        }) => Promise<Record<string, unknown> | null>;
      };
    }).invitation.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        eventType: true,
        eventDate: true,
        eventTime: true,
        eventPlace: true,
        address: true,
        eventTimezone: true,
        customText: true,
        status: true,
        canvas: true,
        mobileCanvas: true,
      },
    });

    if (!inv) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (inv.status !== 'published') {
      return NextResponse.json({ error: 'not_published' }, { status: 403 });
    }
    return NextResponse.json({
      id: inv.id,
      slug: inv.slug,
      title: inv.title,
      eventType: inv.eventType,
      eventDate: inv.eventDate,
      eventTime: inv.eventTime,
      eventPlace: inv.eventPlace,
      address: inv.address,
      eventTimezone: inv.eventTimezone,
      customText: inv.customText,
      canvas: inv.canvas ?? null,
      mobileCanvas: inv.mobileCanvas ?? null,
    });
  } catch (err) {
    // Migration not applied yet or transient DB error — signal client to
    // fall back to legacy renderer rather than showing an error to guests.
    return NextResponse.json({ canvas: null });
  }
}
