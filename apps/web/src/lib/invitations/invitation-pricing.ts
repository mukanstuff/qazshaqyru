import prisma from '@/lib/shared/db';
import {
  AGENCY_UNLOCK_PLAN,
  LEGACY_PUBLICATION_PRICE_KZT,
  getPlanPriceKzt,
  isPaidPlanSku,
  type PaidPlanSku,
  type PlanSku,
} from '@/lib/entitlements';
import {
  resolveEntitlements,
  type ResolvedEntitlements,
} from '@/lib/entitlements/resolve-entitlements';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { isValidPaidOrder } from '@/lib/payments/pricing-integrity';

/** @deprecated Internal clamp only.
 * 2026-07-30 OWNER MODEL (PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md):
 * Real price for users = Template.priceKzt (via resolvePublicationPriceKzt + getInvitationPricing).
 * This DEFAULT is ONLY a last-resort fallback for broken DB rows or admin creation.
 * Never show "3990" or "Стандарт" in user CTAs, wizard, post-pay, public, SEO.
 */
export const PUBLICATION_PRICE_MIN_KZT = 2_990;
export const PUBLICATION_PRICE_MAX_KZT = 4_990;
export const DEFAULT_PUBLICATION_PRICE_KZT = LEGACY_PUBLICATION_PRICE_KZT;

export interface InvitationPricing {
  templateId: string | null;
  templateSlug: string;
  /** Price of the template (what user actually pays for full access). */
  priceKzt: number;
  templateNameRu: string;
  hasPaidOrder: boolean;
  editingFree: boolean;
  paidTemplateOrder: boolean;
  unlockedPlanSku: PlanSku | null;
  entitlements: ResolvedEntitlements;

  /** 
   * 2026-07-30 product model: true when the user has paid the template price
   * for this invitation → full access (no watermark, all guest ops, full editor).
   */
  fullAccess?: boolean;
}

/**
 * Resolve publication/unlock price from template override or standard plan.
 * Templates with priceKzt === 0 use the standard ladder price.
 */
export function resolvePublicationPriceKzt(templatePriceKzt?: number | null): number {
  if (templatePriceKzt != null && templatePriceKzt > 0) {
    return Math.min(
      Math.max(templatePriceKzt, PUBLICATION_PRICE_MIN_KZT),
      PUBLICATION_PRICE_MAX_KZT
    );
  }
  return DEFAULT_PUBLICATION_PRICE_KZT;
}

export function resolvePlanCheckoutAmount(
  planSku: PaidPlanSku,
  _templatePriceKzt?: number | null
): number {
  // Template price is no longer consulted here — `paidTemplateOrder` is resolved
  // separately by `resolvePaidTemplateOrder` against `getInvitationPricing`.
  return getPlanPriceKzt(planSku);
}

function mapDbPlanSku(value: string | null | undefined): PlanSku | null {
  if (!value) return null;
  // Legacy `standard`/`premium` rows in DB are normalized to null — they never
  // confer entitlements in the new template-purchase model. Agency is the only
  // real subscription product left.
  if (value === 'agency') return value;
  return null;
}

export function resolvePaidTemplateOrder(
  hasPaidOrder: boolean,
  unlockedPlanSku: string | null | undefined
): boolean {
  return hasPaidOrder || unlockedPlanSku === 'standard' || unlockedPlanSku === 'premium';
}

/**
 * Resolve template price + entitlements for an invitation.
 */
export async function getInvitationPricing(
  invitationId: string,
  userId: string
): Promise<InvitationPricing | null> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: {
      templateId: true,
      templateKey: true,
      unlockedPlanSku: true,
      template: { select: { id: true, slug: true, priceKzt: true, nameRu: true } },
      orders: {
        where: { status: 'paid', orderType: 'self' },
        select: {
          id: true,
          templateId: true,
          amountKzt: true,
          status: true,
          planSku: true,
        },
        orderBy: { paidAt: 'desc' },
      },
      user: {
        select: { planSku: true, planExpiresAt: true },
      },
    },
  });

  if (!invitation) return null;

  let template =
    (await resolveTemplateBySlug(invitation.templateKey)) ??
    invitation.template ??
    (invitation.templateId
      ? await prisma.template.findUnique({
          where: { id: invitation.templateId },
          select: { id: true, slug: true, priceKzt: true, nameRu: true },
        })
      : null);

  const templateId = template?.id ?? invitation.templateId;
  const priceKzt = template
    ? resolvePublicationPriceKzt(template.priceKzt)
    : DEFAULT_PUBLICATION_PRICE_KZT;

  type PricingOrderRow = { id: string; status: 'pending' | 'paid' | 'cancelled' | 'refunded'; templateId: string; amountKzt: number };

  // === DECISIVE 2026-07-30 OWNER MODEL (see PRODUCT_DECISIONS_2026-07-30.md) ===
  // Paying the template's real priceKzt ONCE = FULL ACCESS for this single invitation.
  // No more "free publish → pay for Standard → pay for Premium".
  // fullAccess = true → no watermark + all guest ops + custom slug + full editor.
  const paidTemplateOrder = resolvePaidTemplateOrder(
    invitation.orders.some((order: PricingOrderRow) => isValidPaidOrder(order, templateId, priceKzt)),
    invitation.unlockedPlanSku
  );

  const unlockedPlanSku = mapDbPlanSku(invitation.unlockedPlanSku);

  let entitlements = resolveEntitlements({
    now: new Date(),
    user: {
      planSku: mapDbPlanSku(invitation.user.planSku),
      planExpiresAt: invitation.user.planExpiresAt,
    },
    invitation: { unlockedPlanSku },
  });

  const hasPaidOrder = paidTemplateOrder;
  const fullAccess = paidTemplateOrder;

  if (fullAccess) {
    // Force the real product behavior regardless of old ladder logic
    entitlements = {
      ...entitlements,
      watermark: false,
      guestOps: true,
      funnel: true,
      reminders: true,
      seating: true,
      household: true,
      csvExport: true,
      restaurantLink: true,
      customSlug: true,
      priority: false, // not part of single template price
    };
  }

  return {
    templateId,
    templateSlug: template?.slug ?? invitation.templateKey,
    priceKzt,
    templateNameRu: template?.nameRu ?? 'Приглашение',
    paidTemplateOrder,
    hasPaidOrder,
    editingFree: true,
    unlockedPlanSku,
    entitlements,
    fullAccess,
  };
}

export function assertPaidPlanSku(value: string | undefined | null): PaidPlanSku {
  if (value && isPaidPlanSku(value)) return value;
  return AGENCY_UNLOCK_PLAN;
}
