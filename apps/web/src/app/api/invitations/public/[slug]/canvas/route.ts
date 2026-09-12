/**
 * Public API: fetch the canvas document + invitation data needed by the
 * guest page. Returns `canvas: null` for invitations still on the legacy
 * section engine — the client falls back to InvitationLayoutRouter.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';
import { resolvePublicationPriceKzt, resolvePaidTemplateOrder } from '@/lib/invitations/invitation-pricing';
import { shouldShowPublishWatermark } from '@/lib/invitations/publish-watermark';
import { getCurrentSession } from '@/lib/shared/api';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';

export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  try {
    const inv = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        userId: true,
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
        templateId: true,
        templateKey: true,
        orders: {
          where: { status: 'paid', orderType: 'self' },
          select: { id: true, templateId: true, amountKzt: true },
        },
      },
    });

    if (!inv) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    // Summed across every paid order (not just the most recent one) so a
    // template switch paid for in two steps — the original purchase plus a
    // top-up for the price difference — still adds up to full access.
    const totalPaidKzt = inv.orders.reduce((sum: number, o: { amountKzt: number }) => sum + o.amountKzt, 0);
    const session = await getCurrentSession();
    const isOwner = session?.user.id === inv.userId;
    if (inv.status !== 'published') {
      if (!isOwner) {
        return NextResponse.json({ error: 'not_published' }, { status: 403 });
      }
    }

    // 2026-07-30 NEXT: for published + paid invitations, ensure canvas exists.
    // This makes the public guest experience always canvas-first.
    let hasCanvas = !!inv.canvas;

    // One template lookup per request. The seeding branch below and the
    // fullAccess computation after it each ran their own identical
    // `template.findUnique`, so an invitation without a canvas paid for two.
    const templatePrice = inv.templateId
      ? (await prisma.template.findUnique({ where: { id: inv.templateId }, select: { priceKzt: true } }))?.priceKzt ?? null
      : null;
    const priceKzt = resolvePublicationPriceKzt(templatePrice);
    const hasPaidOrder = resolvePaidTemplateOrder(totalPaidKzt, priceKzt);

    if (!hasCanvas && hasPaidOrder) {
      {
        // Seed canvas so guest page and editor are consistent.
        // We use a light tx here (public read path).
        await prisma.$transaction(async (tx: any) => {
          await ensureCanvasDocument(tx, inv.id);
        });

        // Re-fetch to get the newly seeded canvas
        const refreshed = await prisma.invitation.findUnique({
          where: { id: inv.id },
          select: { canvas: true },
        });
        if (refreshed?.canvas) {
          hasCanvas = true;
          (inv as any).canvas = refreshed.canvas;
        }
      }
    }

    const showWatermark =
      inv.status === 'published' &&
      shouldShowPublishWatermark({ priceKzt, hasPaidOrder, fullAccess: hasPaidOrder });

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
      canvas: (inv as any).canvas ?? null,
      fullAccess: hasPaidOrder,
      showWatermark,
      isOwner,
      /*
       * Whether a guest arriving on the plain public link (no ?guest= token)
       * can answer at all. Open RSVP is OFF by default for wedding, той,
       * беташар, қыз ұзату, сүндет той and тұсаукесер — those use personal
       * links. The guest page did not receive this flag, so it rendered the
       * RSVP form to everyone; on a wedding, filling it in and pressing send
       * answered 403 open_rsvp_disabled with no explanation.
       */
      openRsvp: isOpenRsvpEnabled(inv.customText, inv.eventType),
    });
  } catch (err) {
    /*
     * Report a failure as a failure.
     *
     * This used to answer 200 with `{ canvas: null }` for any thrown error,
     * which the guest page reads as "this invitation has no design" and turns
     * into «Приглашение недоступно». A database hiccup therefore told the
     * guests of a paying customer that the invitation does not exist, and the
     * 200 kept the incident out of every error metric.
     */
    console.error('Public canvas route failed', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
