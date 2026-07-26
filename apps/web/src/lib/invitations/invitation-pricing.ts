import prisma from '@/lib/shared/db';
import {
  DEFAULT_UNLOCK_PLAN,
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

/** @deprecated Prefer getPlanPriceKzt('standard') — kept for existing imports. */
export const PUBLICATION_PRICE_MIN_KZT = 2_990;
export const PUBLICATION_PRICE_MAX_KZT = 4_990;
export const DEFAULT_PUBLICATION_PRICE_KZT = LEGACY_PUBLICATION_PRICE_KZT;

export interface InvitationPricing {
  templateId: string | null;
  templateSlug: string;
  /** Standard unlock price (default pay intent). */
  priceKzt: number;
  templateNameRu: string;
  hasPaidOrder: boolean;
  editingFree: boolean;
  unlockedPlanSku: PlanSku | null;
  entitlements: ResolvedEntitlements;
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
  templatePriceKzt?: number | null
): number {
  if (planSku === 'standard') {
    return resolvePublicationPriceKzt(templatePriceKzt);
  }
  return getPlanPriceKzt(planSku);
}

function mapDbPlanSku(value: string | null | undefined): PlanSku | null {
  if (!value) return null;
  if (value === 'standard' || value === 'premium' || value === 'agency') return value;
  return null;
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

  const unlockedFromOrders = invitation.orders.some((order) =>
    isValidPaidOrder(order, templateId, priceKzt)
  );

  const unlockedPlanSku =
    mapDbPlanSku(invitation.unlockedPlanSku) ??
    (unlockedFromOrders ? DEFAULT_UNLOCK_PLAN : null);

  const entitlements = resolveEntitlements({
    now: new Date(),
    user: {
      planSku: mapDbPlanSku(invitation.user.planSku),
      planExpiresAt: invitation.user.planExpiresAt,
    },
    invitation: { unlockedPlanSku },
  });

  const hasPaidOrder = !entitlements.watermark;

  return {
    templateId,
    templateSlug: template?.slug ?? invitation.templateKey,
    priceKzt,
    templateNameRu: template?.nameRu ?? 'Приглашение',
    hasPaidOrder,
    editingFree: true,
    unlockedPlanSku,
    entitlements,
  };
}

export function assertPaidPlanSku(value: string | undefined | null): PaidPlanSku {
  if (value && isPaidPlanSku(value)) return value;
  return DEFAULT_UNLOCK_PLAN;
}
