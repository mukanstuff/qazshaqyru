/**
 * Public API: fetch the canvas document + invitation data needed by the
 * guest page. Returns `canvas: null` for invitations still on the legacy
 * section engine — the client falls back to InvitationLayoutRouter.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';
import { isValidPaidOrder } from '@/lib/payments/pricing-integrity';
import { resolvePublicationPriceKzt } from '@/lib/invitations/invitation-pricing';

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
        templateId: true,
        templateKey: true,
        orders: {
          where: { status: 'paid', orderType: 'self' },
          select: { id: true, templateId: true, amountKzt: true },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!inv) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (inv.status !== 'published') {
      return NextResponse.json({ error: 'not_published' }, { status: 403 });
    }

    // 2026-07-30 NEXT: for published + paid invitations, ensure canvas exists.
    // This makes the public guest experience always canvas-first.
    let hasCanvas = !!inv.canvas;

    if (!hasCanvas) {
      const templatePrice = inv.templateId
        ? (await prisma.template.findUnique({ where: { id: inv.templateId }, select: { priceKzt: true } }))?.priceKzt ?? null
        : null;

      const priceKzt = resolvePublicationPriceKzt(templatePrice);
      const hasPaid = inv.orders.some((o: any) => isValidPaidOrder(o, inv.templateId, priceKzt));

      if (hasPaid) {
        // Seed canvas so guest page and editor are consistent.
        // We use a light tx here (public read path).
        await prisma.$transaction(async (tx: any) => {
          await ensureCanvasDocument(tx, inv.id);
        });

        // Re-fetch to get the newly seeded canvas
        const refreshed = await prisma.invitation.findUnique({
          where: { id: inv.id },
          select: { canvas: true, mobileCanvas: true },
        });
        if (refreshed?.canvas) {
          hasCanvas = true;
          (inv as any).canvas = refreshed.canvas;
          (inv as any).mobileCanvas = refreshed.mobileCanvas;
        }
      }
    }

    // Compute fullAccess for the guest renderer (no watermark for paid)
    const templatePrice = inv.templateId
      ? (await prisma.template.findUnique({ where: { id: inv.templateId }, select: { priceKzt: true } }))?.priceKzt ?? null
      : null;
    const priceKzt = resolvePublicationPriceKzt(templatePrice);
    const hasPaidOrder = inv.orders.some((o: any) => isValidPaidOrder(o, inv.templateId, priceKzt));

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
      mobileCanvas: (inv as any).mobileCanvas ?? null,
      fullAccess: hasPaidOrder,
    });
  } catch (err) {
    // Graceful fallback for migration / transient errors
    return NextResponse.json({ canvas: null });
  }
}
