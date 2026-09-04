import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS, getCurrentSession } from '@/lib/shared/api';
import { isEventPast } from '@/lib/shared/event-datetime';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import { shouldShowPublishWatermark } from '@/lib/invitations/publish-watermark';
import { resolvePublicationPriceKzt, resolvePaidTemplateOrder } from '@/lib/invitations/invitation-pricing';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { resolveEntitlements, type LegacyPlanSku, type PlanSku } from '@/lib/entitlements';

function mapPlanSku(value: string | null | undefined): PlanSku | LegacyPlanSku | null {
  if (value === 'standard' || value === 'premium' || value === 'agency') return value;
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const rate = await applyRateLimit(request, `public_inv:${slug}`, RATE_LIMITS.PUBLIC_INVITATION);
    if (!rate.allowed) return rateLimitResponse(rate);

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            language: true,
            name: true,
            planSku: true,
            planExpiresAt: true,
          },
        },
        template: { select: { id: true, nameRu: true, nameKz: true, slug: true, priceKzt: true } },
        orders: {
          where: { status: 'paid' },
          select: { id: true, templateId: true, amountKzt: true, status: true },
          orderBy: { paidAt: 'desc' },
        },
        _count: { select: { guests: true } },
      },
    });

    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    // The family-preview token is gone: nothing minted one, no row ever
    // carried a hash, and sharing a draft before payment is against the
    // product rule the publish guard enforces. An unpublished invitation is
    // visible to its owner and to nobody else.
    const session = await getCurrentSession();
    const isOwner = session?.user.id === invitation.userId;
    if (invitation.status !== 'published') {
      if (!isOwner) {
        throw new ApiError('not_found', 'Приглашение не найдено', 404);
      }
    }

    const customText = invitation.customText as Record<string, unknown> | null;
    const openRsvp = isOpenRsvpEnabled(customText, invitation.eventType);
    const localeFromCustom = customText?.invitationLocale;
    const invitationLanguage =
      localeFromCustom === 'kz' || localeFromCustom === 'ru'
        ? localeFromCustom
        : invitation.user.language;

    const catalogTemplate = await resolveTemplateBySlug(invitation.templateKey);
    const template = catalogTemplate ?? invitation.template;
    const priceKzt = resolvePublicationPriceKzt(template?.priceKzt ?? null);
    type PublicOrderRow = { id: string; status: 'pending' | 'paid' | 'cancelled' | 'refunded'; templateId: string; amountKzt: number };
    // Summed across every paid order (not just the current template's), same
    // rule as getInvitationPricing: pay enough in total to cover the current
    // template's price, regardless of which template each payment was for.
    // Do NOT fall back to the invitation's sticky `unlockedPlanSku` — that
    // field never resets on a template switch and would let a single cheap
    // payment stay "fully paid" forever, including for pricier templates.
    const totalPaidKzt = invitation.orders.reduce(
      (sum: number, order: PublicOrderRow) => (order.status === 'paid' ? sum + order.amountKzt : sum),
      0
    );
    const hasPaidOrder = resolvePaidTemplateOrder(totalPaidKzt, priceKzt);

    // 2026-07-30 P0-2: use fullAccess (paid template order) for watermark, same as getInvitationPricing + hub.
    // fullAccess takes precedence over legacy entitlements.watermark.
    const fullAccess = hasPaidOrder;

    const entitlements = resolveEntitlements({
      now: new Date(),
      user: {
        planSku: mapPlanSku(invitation.user.planSku),
        planExpiresAt: invitation.user.planExpiresAt,
      },
    });

    const showWatermark =
      invitation.status === 'published' &&
      shouldShowPublishWatermark({
        priceKzt,
        hasPaidOrder,
        entitlements,
        fullAccess,
      });

    const safeInvitation = {
      id: invitation.id,
      isOwner,
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
        invitation.eventTimezone
      ),
      guestCount: invitation._count.guests,
      showWatermark,
    };

    return NextResponse.json({ invitation: safeInvitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get public invitation');
  }
}
