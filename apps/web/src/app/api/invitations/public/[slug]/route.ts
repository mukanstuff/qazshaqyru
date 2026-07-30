import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';
import { isEventPast } from '@/lib/shared/event-datetime';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import { verifyPreviewToken } from '@/lib/invitations/preview-token';
import { shouldShowPublishWatermark } from '@/lib/invitations/publish-watermark';
import { resolvePublicationPriceKzt } from '@/lib/invitations/invitation-pricing';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { isValidPaidOrder } from '@/lib/payments/pricing-integrity';
import { resolveEntitlements, type PlanSku } from '@/lib/entitlements';

function mapPlanSku(value: string | null | undefined): PlanSku | null {
  if (value === 'standard' || value === 'premium' || value === 'agency') return value;
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const previewToken = request.nextUrl.searchParams.get('preview');

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
        template: { select: { id: true, nameRu: true, nameKz: true, slug: true, config: true, priceKzt: true } },
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

    const isFamilyPreview =
      invitation.status === 'draft' &&
      previewToken &&
      verifyPreviewToken(previewToken, invitation.previewTokenHash);

    if (invitation.status !== 'published' && !isFamilyPreview) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
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
    const templateId = template?.id ?? invitation.templateId;
    const priceKzt = resolvePublicationPriceKzt(template?.priceKzt ?? null);
    type PublicOrderRow = { id: string; status: 'pending' | 'paid' | 'cancelled' | 'refunded'; templateId: string; amountKzt: number };
    const hasPaidOrder = invitation.orders.some((order: PublicOrderRow) =>
      isValidPaidOrder(order, templateId, priceKzt)
    );

    // 2026-07-30 P0-2: use fullAccess (paid template order) for watermark, same as getInvitationPricing + hub.
    // fullAccess takes precedence over legacy entitlements.watermark.
    const fullAccess = hasPaidOrder;

    const entitlements = resolveEntitlements({
      now: new Date(),
      user: {
        planSku: mapPlanSku(invitation.user.planSku),
        planExpiresAt: invitation.user.planExpiresAt,
      },
      invitation: {
        unlockedPlanSku: mapPlanSku(invitation.unlockedPlanSku),
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
      isFamilyPreview,
      showWatermark,
    };

    return NextResponse.json({ invitation: safeInvitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get public invitation');
  }
}
