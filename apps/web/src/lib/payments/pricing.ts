/**
 * Checkout product routing — single source of truth for which product the user
 * is buying and how much it costs.
 *
 * Two products exist today:
 *  1. TEMPLATE_PURCHASE — one-time, per-invitation, charged at the template's priceKzt.
 *     Grants full access for that single invitation (no watermark, all guest ops,
 *     custom slug, full canvas editor).
 *  2. AGENCY_SUBSCRIPTION — recurring monthly, user-level, charged at PLAN_CATALOG.agency.priceKzt.
 *     Grants unlimited invitations + priority + custom slug for AGENCY_DURATION_DAYS days.
 *
 * Routing rules (see determineCheckout):
 *  - intent: 'pay' | 'publish' (admin) → TEMPLATE_PURCHASE, planSku='standard' (legacy marker),
 *    planScope='invitation', planDurationDays=null.
 *  - intent: 'plan' | 'agency' AND planSku: 'agency' → AGENCY_SUBSCRIPTION, planSku='agency',
 *    planScope='user', planDurationDays=AGENCY_DURATION_DAYS.
 *  - Any other combination → rejected with ApiError.
 *
 * Critically: TEMPLATE_PURCHASE never produces a user-level agency unlock, even though
 * Order.planSku is set to 'standard' for backward compatibility with the legacy ladder.
 * The productType discriminator + planScope='invitation' prevent apply-plan-unlock.ts
 * from activating agency plan for template purchases.
 */
import {
  AGENCY_DURATION_DAYS,
  getPlanDefinition,
  type LegacyPlanSku,
  type PaidPlanSku,
} from '@/lib/entitlements';
import { ApiError } from '@/lib/shared/api';

/** Logical product type — what the user is actually buying. */
export type CheckoutProductType = 'template' | 'agency';

/** Intent accepted by /api/invitations/[id]/checkout (kept compatible with existing 'plan' alias). */
export type CheckoutIntent = 'publish' | 'pay' | 'plan' | 'agency';

/**
 * Marker for the one-time template purchase product. NOT stored on Order.planSku
 * (which uses the Prisma PlanSku enum: standard/premium/agency). Instead, the order
 * is marked with planSku='standard' + planScope='invitation', which is the historical
 * shape for "this invitation got unlocked by a one-time payment".
 */
export const TEMPLATE_PURCHASE_SKU = 'template_purchase' as const;

/**
 * PlanSku marker stored on Order for template purchases.
 * 'standard' here means "one-time invite unlock" (legacy compat). It is NOT a
 * subscription; the Prisma PlanSku enum is reused only because Order.planSku is
 * already typed against it.
 */
export const TEMPLATE_ORDER_PLAN_SKU = 'standard' as const;

/** PlanSku stored on Order for agency subscription purchases. */
export const AGENCY_ORDER_PLAN_SKU: PaidPlanSku = 'agency';

export interface CheckoutRouting {
  productType: CheckoutProductType;
  /** What to write into Order.planSku — 'standard' for template, 'agency' for subscription. */
  orderPlanSku: LegacyPlanSku | PaidPlanSku;
  /** What to write into Order.planScope. */
  planScope: 'invitation' | 'user';
  /** What to write into Order.planDurationDays (null = one-time). */
  planDurationDays: number | null;
  /** What to charge the customer (KZT). */
  chargeAmountKzt: number;
  /** Human-readable description shown to the customer / on payment page. */
  description: string;
}

export interface DetermineCheckoutInput {
  intent: CheckoutIntent;
  /** Optional explicit plan SKU requested by the client (e.g. 'agency'). */
  requestedPlanSku?: string | null | undefined;
  /** Required for TEMPLATE_PURCHASE — the template's priceKzt. */
  templatePriceKzt: number;
  /** Required for TEMPLATE_PURCHASE — used in description. */
  templateName: string;
}

export function determineCheckout(input: DetermineCheckoutInput): CheckoutRouting {
  const { intent, requestedPlanSku, templatePriceKzt, templateName } = input;

  // Hard rejection: planSku=agency MUST be paired with intent='agency' (or legacy intent='plan').
  // Otherwise the client is trying to sneak an agency purchase into a template flow.
  if (requestedPlanSku === 'agency' && intent !== 'agency' && intent !== 'plan') {
    throw new ApiError(
      'validation_error',
      'Покупка Agency доступна только с intent: "agency".',
      400
    );
  }

  const agencyRequested = requestedPlanSku === 'agency';
  const agencyIntent = intent === 'agency' || (intent === 'plan' && agencyRequested);

  if (agencyIntent) {
    // Agency is the ONLY subscription product. Only purchasable via explicit agency intent
    // (or legacy 'plan' + planSku='agency') so it never collides with template purchases.
    const agencyPriceKzt = getPlanDefinition('agency').priceKzt;
    return {
      productType: 'agency',
      orderPlanSku: AGENCY_ORDER_PLAN_SKU,
      planScope: 'user',
      planDurationDays: AGENCY_DURATION_DAYS,
      chargeAmountKzt: agencyPriceKzt,
      description: `QazShaqyru Agency — ${AGENCY_DURATION_DAYS} дней`,
    };
  }

  if (intent === 'pay' || intent === 'publish') {
    // One-time template purchase. Charge the template's price (NOT agency price).
    // Order.planSku='standard' is a legacy compat marker meaning "invitation-level unlock".
    if (templatePriceKzt <= 0) {
      throw new ApiError(
        'validation_error',
        'У шаблона не указана цена. Свяжитесь с поддержкой.',
        400
      );
    }
    return {
      productType: 'template',
      orderPlanSku: TEMPLATE_ORDER_PLAN_SKU,
      planScope: 'invitation',
      planDurationDays: null,
      chargeAmountKzt: templatePriceKzt,
      description: `QazShaqyru «${templateName}»`,
    };
  }

  // Any other combination is invalid. We deliberately do NOT default missing planSku
  // to agency — that was the bug that caused template purchases to be charged 20,000 KZT.
  throw new ApiError(
    'validation_error',
    `Недопустимая комбинация intent=${intent} planSku=${requestedPlanSku ?? '∅'}`,
    400
  );
}