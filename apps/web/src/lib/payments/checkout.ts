import { Prisma } from '@prisma/client';

type PrismaTx = any;

import prisma from '@/lib/shared/db';
import { checkPromoCode, consumePromoRedemption, releasePromoRedemption } from '@/lib/payments/promo';
import { ApiError } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { getPaymentProvider } from '@/lib/payments';
import { KaspiPaymentError } from '@/lib/payments/kaspi-errors';
import { isStalePendingOrder } from '@/lib/payments/pricing-integrity';
import {
  AGENCY_ORDER_PLAN_SKU,
  determineCheckout,
  type CheckoutIntent,
  type CheckoutRouting,
} from '@/lib/payments/pricing';
import type { SessionUser } from '@/lib/shared/api';
import {
  resolveCheckoutProvider,
  type PaymentProviderName,
} from '@/lib/payments/payment-provider-config';
import { publishInvitationIfDraft } from '@/lib/invitations/invitation-publish';
import { applyPlanUnlockInTx } from '@/lib/payments/apply-plan-unlock';
import { type LegacyPlanSku, type PaidPlanSku } from '@/lib/entitlements';
import type { AttributionData } from '@/lib/shared/attribution';

/**
 * Manual Kaspi Pay: the site owner shares their own free кассир pay link
 * (pay.kaspi.kz/pay/... from the Kaspi Pay app's "Удалённая оплата" →
 * "Ссылка для оплаты") via KASPI_MANUAL_PAY_LINK. There is no automated
 * gateway or webhook for this — Kaspi's own remote-payment link has no such
 * thing publicly; the customer types the amount in themselves and confirms
 * over WhatsApp, and an admin marks the order paid by hand.
 */
export const MANUAL_KASPI_PROVIDER = 'kaspi_manual' as const;

/**
 * Recorded on an order a promo code paid for in full. It is a real paid order
 * with a real amount of zero — not a payment, and it should not look like one
 * in the admin's revenue list.
 */
export const PROMO_FULL_DISCOUNT_PROVIDER = 'promo' as const;

export function getManualKaspiPayLink(): string | null {
  const link = process.env.KASPI_MANUAL_PAY_LINK?.trim();
  return link ? link : null;
}

export interface CheckoutResult {
  published: boolean;
  needsPayment: boolean;
  paymentUrl: string | null;
  publicUrl: string | null;
  orderId: string | null;
  amountKzt: number;
  invitationId: string | null;
  slug: string | null;
  planSku: LegacyPlanSku | PaidPlanSku | null;
  /** True when paymentUrl is a manual Kaspi transfer link (customer types
   *  the amount themselves, confirms over WhatsApp) rather than an
   *  automated gateway's hosted checkout page. */
  manual: boolean;
  /** Promo code actually applied to this order, and what it took off.
   *  Null when none was sent or the one sent did not apply — the caller
   *  shows the real total either way rather than the one it hoped for. */
  promoCode: string | null;
  discountKzt: number;
}

function buildMockPaymentUrl(orderId: string, paymentId: string): string {
  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${baseUrl}/mock-payment?orderId=${orderId}&token=${paymentId}`;
}

function resolveOrderPaymentUrl(order: {
  id: string;
  paymentId: string | null;
  paymentProvider: string | null;
  paymentUrl: string | null;
}): string | null {
  if (order.paymentUrl) return order.paymentUrl;
  if (order.paymentProvider === 'mock' && order.paymentId) {
    return buildMockPaymentUrl(order.id, order.paymentId);
  }
  return null;
}

function buildNeedsPaymentResult(
  order: {
    id: string;
    amountKzt: number;
    paymentProvider?: string | null;
    discountKzt?: number | null;
  },
  invitation: { id: string; slug: string } | null,
  paymentUrl: string | null,
  planSku: LegacyPlanSku | PaidPlanSku,
  promoCodeApplied: string | null = null
): CheckoutResult {
  return {
    published: false,
    needsPayment: true,
    paymentUrl,
    publicUrl: invitation ? null : null,
    orderId: order.id,
    amountKzt: order.amountKzt,
    invitationId: invitation?.id ?? null,
    slug: invitation?.slug ?? null,
    planSku,
    manual: order.paymentProvider === MANUAL_KASPI_PROVIDER,
    promoCode: promoCodeApplied,
    discountKzt: order.discountKzt ?? 0,
  };
}

export type { CheckoutIntent } from '@/lib/payments/pricing';

/**
 * Checkout flow:
 * - intent 'pay' | 'publish' (admin): one-time TEMPLATE_PURCHASE → charge template.priceKzt,
 *   planScope='invitation', planDurationDays=null. NEVER activates agency.
 * - intent 'agency' | 'plan' + planSku='agency': AGENCY subscription → charge agency price,
 *   planScope='user', planDurationDays=AGENCY_DURATION_DAYS.
 *
 * Routing is decided by determineCheckout() (lib/payments/pricing.ts). The legacy
 * assertPaidPlanSku fallback that defaulted missing planSku to 'agency' is intentionally
 * NOT used here — that was the bug that charged 20,000 KZT for any template purchase.
 */
export async function checkoutInvitation(
  invitationId: string | null,
  user: SessionUser,
  options: {
    appUrl: string;
    provider?: PaymentProviderName;
    intent?: CheckoutIntent;
    planSku?: string | null;
    /** First-touch UTM data (see lib/shared/attribution.ts), stamped onto the order this checkout creates. */
    attribution?: AttributionData | null;
    /** Raw code as typed by the customer; normalized and validated downstream.
     *  An unknown or expired code is not an error — checkout continues at full
     *  price and the result says no code was applied. */
    promoCode?: string | null;
  }
): Promise<CheckoutResult> {
  const intent = options.intent ?? 'pay';

  // Agency is purchased WITHOUT an invitation, so we can route it before requiring one.
  if (intent === 'agency' || (intent === 'plan' && options.planSku === 'agency')) {
    const routing = determineCheckout({
      intent,
      requestedPlanSku: options.planSku,
      // Agency doesn't charge a template price, but the routing API requires it.
      templatePriceKzt: 0,
      templateName: '',
    });
    const agencyPromo = options.promoCode
      ? await checkPromoCode(options.promoCode, routing.chargeAmountKzt, 'agency')
      : null;
    return checkoutAgency(user, {
      appUrl: options.appUrl,
      providerName: resolveCheckoutProvider(options.provider),
      routing,
      promo: agencyPromo?.ok ? agencyPromo : null,
      attribution: options.attribution,
    });
  }

  if (!invitationId) {
    throw new ApiError('validation_error', 'Укажите приглашение', 400);
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: user.id },
    select: {
      id: true,
      slug: true,
      status: true,
      title: true,
      eventDate: true,
      eventType: true,
    },
  });

  if (!invitation) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  if (invitation.status === 'archived') {
    throw new ApiError('validation_error', 'Приглашение в архиве', 400);
  }

  const pricing = await getInvitationPricing(invitationId, user.id);
  if (!pricing) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const publicUrlFor = (slug: string) => `${options.appUrl.replace(/\/$/, '')}/i/${slug}`;
  const publicUrl = publicUrlFor(invitation.slug);
  const unpaid = pricing.entitlements.watermark;

  if (!unpaid && (intent === 'publish' || intent === 'pay' || intent === 'plan')) {
    // Already fully unlocked via template purchase or agency.
    // Per 2026-07-30 product model: paying template price = complete access.
    // Publishing can rename the slug (draft-… → readable), so the response
    // must carry the slug that is now live, not the one read a moment ago.
    const publishedSlug = (await publishInvitationIfDraft(invitation.id)) ?? invitation.slug;
    return {
      published: true,
      needsPayment: false,
      paymentUrl: null,
      publicUrl: publicUrlFor(publishedSlug),
      orderId: null,
      amountKzt: 0,
      invitationId: invitation.id,
      slug: publishedSlug,
      planSku: null,
      manual: false,
      promoCode: null,
      discountKzt: 0,
    };
  }

  // 2026-08-26: free-tier restored. 'publish' with no payment publishes
  // immediately with the invitation's current (unpaid) entitlements — the
  // 'free' plan, which shows a watermark (see publish-watermark.ts). No
  // order is created and no charge happens; the user can still pay later
  // (intent: 'pay', handled above) to remove the watermark on the same
  // published invitation.
  if (intent === 'publish') {
    // Publishing can rename the slug (draft-… → readable), so the response
    // must carry the slug that is now live, not the one read a moment ago.
    const publishedSlug = (await publishInvitationIfDraft(invitation.id)) ?? invitation.slug;
    return {
      published: true,
      needsPayment: false,
      paymentUrl: null,
      publicUrl: publicUrlFor(publishedSlug),
      orderId: null,
      amountKzt: 0,
      invitationId: invitation.id,
      slug: publishedSlug,
      planSku: null,
      manual: false,
      promoCode: null,
      discountKzt: 0,
    };
  }

  // Regular user path: 'pay' for template purchase.
  // Reject 'plan' here — only the agency branch above accepts 'plan'.
  if (intent === 'plan') {
    throw new ApiError(
      'validation_error',
      'Для покупки тарифа используйте intent: "agency" или прямой endpoint /api/plans/agency/checkout.',
      400
    );
  }

  // intent: 'pay' (template purchase)
  if (!pricing.templateId) {
    throw new ApiError(
      'validation_error',
      'Не удалось определить шаблон. Выберите шаблон заново из каталога.',
      400
    );
  }

  // Charge only the difference between the current template's price and
  // what's already been paid on this invitation (across every template it's
  // ever used) — e.g. after switching from a cheaper template to a pricier
  // one. We only reach this branch when `unpaid` is true, i.e.
  // totalPaidKzt < priceKzt, so the difference is always positive.
  const amountDueKzt = Math.max(pricing.priceKzt - pricing.totalPaidKzt, 0) || pricing.priceKzt;

  /*
   * A promo code lowers what this checkout charges — nothing else. It does not
   * change the template price, the entitlement it unlocks, or what a later
   * top-up costs, because those are all derived from the template and from
   * what was actually paid.
   */
  const promo = options.promoCode
    ? await checkPromoCode(options.promoCode, amountDueKzt, 'template')
    : null;
  const routing = determineCheckout({
    intent: 'pay',
    requestedPlanSku: options.planSku,
    templatePriceKzt: amountDueKzt,
    templateName: pricing.templateNameRu,
  });

  // Manual Kaspi transfer: no automated gateway, no webhook. The customer
  // is sent to a static Kaspi Pay link the site owner already has for free
  // (pay.kaspi.kz/pay/... from their own Kaspi Pay cashier app — see
  // getManualKaspiPayLink), types the amount in themselves, then confirms
  // via WhatsApp with the order id; an admin marks the order paid by hand
  // in /admin/orders. Takes priority over a real gateway when configured,
  // since it needs zero setup and this is what's actually reachable today.
  const manualLink = getManualKaspiPayLink();
  const providerName: PaymentProviderName | typeof MANUAL_KASPI_PROVIDER = manualLink
    ? MANUAL_KASPI_PROVIDER
    : resolveCheckoutProvider(options.provider);

  return runTemplateCheckout({
    invitation,
    user,
    options,
    pricing,
    providerName,
    routing,
    publicUrl,
    manualLink,
    promo: promo?.ok ? promo : null,
  });
}

async function checkoutAgency(
  user: SessionUser,
  options: {
    appUrl: string;
    providerName: PaymentProviderName;
    routing: CheckoutRouting;
    promo?: { promoId: string; code: string; discountKzt: number } | null;
    attribution?: AttributionData | null;
  }
): Promise<CheckoutResult> {
  const { providerName, routing, appUrl, attribution, promo = null } = options;

  // Need a templateId for Order FK — use any active template
  const template = await prisma.template.findFirst({
    where: { isActive: true },
    select: { id: true, nameRu: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (!template) {
    throw new ApiError('validation_error', 'Нет активных шаблонов для оформления тарифа', 500);
  }

  const checkoutState = await prisma.$transaction(async (tx: PrismaTx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`checkout:agency:${user.id}`}))`;

    let pendingOrder = await tx.order.findFirst({
      where: {
        userId: user.id,
        status: 'pending',
        orderType: 'self',
        planSku: AGENCY_ORDER_PLAN_SKU,
        invitationId: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const targetAmountKzt = routing.chargeAmountKzt - (promo?.discountKzt ?? 0);

    if (pendingOrder && pendingOrder.amountKzt !== targetAmountKzt) {
      await tx.order.update({
        where: { id: pendingOrder.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      if (pendingOrder.promoCodeId) {
        await releasePromoRedemption(pendingOrder.promoCodeId, tx);
      }
      pendingOrder = null;
    }

    if (pendingOrder?.paymentId && pendingOrder.paymentProvider) {
      return { order: pendingOrder, resumePayment: true as const };
    }

    // Same authoritative take as the template path: the pre-check can go stale.
    let appliedPromo = promo;
    let chargeKzt = targetAmountKzt;
    if (appliedPromo && !pendingOrder) {
      const took = await consumePromoRedemption(appliedPromo.promoId, tx);
      if (!took) {
        chargeKzt = routing.chargeAmountKzt;
        appliedPromo = null;
      }
    }

    let order = pendingOrder;
    if (!order) {
      order = await tx.order.create({
        data: {
          userId: user.id,
          templateId: template.id,
          invitationId: null,
          amountKzt: chargeKzt,
          promoCodeId: appliedPromo?.promoId ?? null,
          discountKzt: appliedPromo?.discountKzt ?? 0,
          customerPhone: user.phone,
          customerName: user.name,
          status: 'pending',
          orderType: 'self',
          paymentProvider: providerName,
          planSku: AGENCY_ORDER_PLAN_SKU,
          planScope: 'user',
          planDurationDays: routing.planDurationDays,
          utmSource: attribution?.utmSource,
          utmMedium: attribution?.utmMedium,
          utmCampaign: attribution?.utmCampaign,
          utmTerm: attribution?.utmTerm,
          utmContent: attribution?.utmContent,
        },
      });
    }

    if (order.paymentProvider !== providerName) {
      order = await tx.order.update({
        where: { id: order.id },
        data: { paymentProvider: providerName, paymentId: null, paymentUrl: null },
      });
    }

    return { order, resumePayment: false as const };
  });

  return finalizeProviderCheckout({
    order: checkoutState.order,
    resumePayment: checkoutState.resumePayment,
    invitation: null,
    user,
    appUrl,
    providerName,
    planSku: AGENCY_ORDER_PLAN_SKU,
    // The order's amount, for the same reason as the template path: a promo
    // that ran out mid-transaction leaves the order at full price.
    chargeAmount: checkoutState.order.amountKzt,
    description: routing.description,
    failUrl: `${appUrl}/dashboard?payment=failed`,
    promoCodeApplied: checkoutState.order.promoCodeId ? (promo?.code ?? null) : null,
  });
}

async function runTemplateCheckout(args: {
  invitation: {
    id: string;
    slug: string;
    status: string;
    title: string;
    eventDate: Date;
    eventType: string;
  };
  user: SessionUser;
  options: {
    appUrl: string;
    provider?: PaymentProviderName;
    attribution?: AttributionData | null;
  };
  pricing: {
    templateId: string | null;
    priceKzt: number;
    templateNameRu: string;
  };
  providerName: PaymentProviderName | typeof MANUAL_KASPI_PROVIDER;
  routing: CheckoutRouting;
  publicUrl: string;
  manualLink: string | null;
  /** Already validated and priced against this charge; null when none applies. */
  promo: { promoId: string; code: string; discountKzt: number } | null;
}): Promise<CheckoutResult> {
  const { invitation, user, options, pricing, providerName, routing, publicUrl, manualLink, promo } = args;
  // What routing says this product costs, minus whatever the promo takes off.
  const chargeAmount = Math.max(routing.chargeAmountKzt - (promo?.discountKzt ?? 0), 0);
  const planSku = routing.orderPlanSku;

  type PrismaTx = any;
  const checkoutState = await prisma.$transaction(async (tx: PrismaTx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`checkout:${invitation.id}:${planSku}`}))`;

    let pendingOrder = await tx.order.findFirst({
      where: {
        invitationId: invitation.id,
        status: 'pending',
        orderType: 'self',
        planSku,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      pendingOrder &&
      isStalePendingOrder(
        {
          templateId: pendingOrder.templateId,
          amountKzt: pendingOrder.amountKzt,
          status: pendingOrder.status,
        },
        pricing.templateId,
        chargeAmount
      )
    ) {
      await tx.order.update({
        where: { id: pendingOrder.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      // The cancelled order was holding a redemption of its promo code. Give
      // it back, or a customer who changes template twice quietly burns three
      // uses of a code they have used none of.
      if (pendingOrder.promoCodeId) {
        await releasePromoRedemption(pendingOrder.promoCodeId, tx);
      }
      pendingOrder = null;
    }

    if (pendingOrder?.paymentId && pendingOrder.paymentProvider) {
      return { order: pendingOrder, resumePayment: true as const };
    }

    /*
     * Take the redemption now, at order creation, and fall back to full price
     * if it is gone. checkPromoCode ran outside this transaction, so between
     * that check and here the last use of the code may have been taken by
     * someone else — this is the only place that can be authoritative.
     */
    let appliedPromo = promo;
    let chargeKzt = chargeAmount;
    if (appliedPromo && !pendingOrder) {
      const took = await consumePromoRedemption(appliedPromo.promoId, tx);
      if (!took) {
        chargeKzt = routing.chargeAmountKzt;
        appliedPromo = null;
      }
    }

    let order = pendingOrder;
    if (!order) {
      try {
        order = await tx.order.create({
          data: {
            userId: user.id,
            templateId: pricing.templateId!,
            invitationId: invitation.id,
            amountKzt: chargeKzt,
            promoCodeId: appliedPromo?.promoId ?? null,
            discountKzt: appliedPromo?.discountKzt ?? 0,
            customerPhone: user.phone,
            customerName: user.name,
            eventDate: invitation.eventDate,
            eventType: invitation.eventType as 'wedding' | 'toy' | 'betashar' | 'kyz_uzatu' | 'sundet_toy' | 'tusau_keser' | 'birthday' | 'anniversary' | 'corporate' | 'other',
            status: 'pending',
            orderType: 'self',
            paymentProvider: providerName,
            planSku,
            planScope: routing.planScope,
            planDurationDays: routing.planDurationDays,
            utmSource: options.attribution?.utmSource,
            utmMedium: options.attribution?.utmMedium,
            utmCampaign: options.attribution?.utmCampaign,
            utmTerm: options.attribution?.utmTerm,
            utmContent: options.attribution?.utmContent,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          order = await tx.order.findFirst({
            where: {
              invitationId: invitation.id,
              status: 'pending',
              orderType: 'self',
            },
            orderBy: { createdAt: 'desc' },
          });
        } else {
          throw error;
        }
      }
    } else if (!order.planSku) {
      order = await tx.order.update({
        where: { id: order.id },
        data: {
          planSku,
          planScope: routing.planScope,
          amountKzt: chargeAmount,
          planDurationDays: routing.planDurationDays,
        },
      });
    }

    if (!order) {
      throw new ApiError('validation_error', 'Не удалось создать заказ', 500);
    }

    /*
     * A code that covers the whole price leaves nothing to pay. Sending the
     * customer to a payment page for 0 ₸ is not a checkout, it is a dead end,
     * so the order is settled here — paid, provider 'promo', entitlement
     * granted through the same helper the payment webhook uses, in the same
     * transaction that took the redemption.
     */
    if (order.amountKzt === 0 && order.status === 'pending') {
      order = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentProvider: PROMO_FULL_DISCOUNT_PROVIDER,
          paymentId: order.id,
          paymentUrl: null,
        },
      });
      await applyPlanUnlockInTx(tx, order);
      return { order, resumePayment: false as const, settled: true as const };
    }

    if (order.paymentProvider !== providerName) {
      order = await tx.order.update({
        where: { id: order.id },
        data: { paymentProvider: providerName, paymentId: null, paymentUrl: null },
      });
    }

    return { order, resumePayment: false as const, settled: false as const };
  });

  if (checkoutState.settled) {
    const publishedSlug = (await publishInvitationIfDraft(invitation.id)) ?? invitation.slug;
    return {
      published: true,
      needsPayment: false,
      paymentUrl: null,
      // Built here rather than reusing `publicUrl`: publishing renames a draft
      // slug, so the URL read before the transaction is the wrong one.
      publicUrl: `${options.appUrl.replace(/\/$/, '')}/i/${publishedSlug}`,
      orderId: checkoutState.order.id,
      amountKzt: 0,
      invitationId: invitation.id,
      slug: publishedSlug,
      planSku,
      manual: false,
      promoCode: promo?.code ?? null,
      discountKzt: checkoutState.order.discountKzt ?? 0,
    };
  }

  return finalizeProviderCheckout({
    order: checkoutState.order,
    resumePayment: checkoutState.resumePayment,
    invitation,
    user,
    appUrl: options.appUrl,
    providerName,
    manualLink,
    planSku,
    // The order's own amount, not the routing figure: if the promo's last
    // redemption was taken by someone else inside the transaction above, the
    // order was written at full price and the payment must match it.
    chargeAmount: checkoutState.order.amountKzt,
    description: routing.description,
    failUrl: `${options.appUrl}/invitations/${invitation.id}?payment=failed`,
    promoCodeApplied: checkoutState.order.promoCodeId ? (promo?.code ?? null) : null,
  });
}

async function finalizeProviderCheckout(params: {
  order: {
    id: string;
    amountKzt: number;
    paymentId: string | null;
    paymentProvider: string | null;
    paymentUrl: string | null;
  };
  resumePayment: boolean;
  manualLink?: string | null;
  invitation: { id: string; slug: string } | null;
  user: SessionUser;
  appUrl: string;
  providerName: PaymentProviderName | typeof MANUAL_KASPI_PROVIDER;
  planSku: LegacyPlanSku | PaidPlanSku;
  chargeAmount: number;
  description: string;
  failUrl: string;
  /** Code recorded on this order, for the response only. */
  promoCodeApplied?: string | null;
}): Promise<CheckoutResult> {
  const {
    order,
    resumePayment,
    manualLink,
    invitation,
    user,
    appUrl,
    providerName,
    planSku,
    chargeAmount,
    description,
    failUrl,
    promoCodeApplied = null,
  } = params;

  if (resumePayment) {
    return buildNeedsPaymentResult(order, invitation, resolveOrderPaymentUrl(order), planSku, promoCodeApplied);
  }

  if (order.paymentId && order.paymentProvider === 'mock') {
    return buildNeedsPaymentResult(order, invitation, resolveOrderPaymentUrl(order), planSku, promoCodeApplied);
  }

  if (providerName === MANUAL_KASPI_PROVIDER) {
    if (!manualLink) {
      throw new ApiError('payment_not_configured', 'Ссылка на оплату Kaspi не настроена', 503);
    }
    if (order.paymentId && order.paymentProvider === MANUAL_KASPI_PROVIDER) {
      return buildNeedsPaymentResult(order, invitation, resolveOrderPaymentUrl(order), planSku, promoCodeApplied);
    }
    await prisma.order.updateMany({
      where: { id: order.id, paymentId: null },
      data: { paymentId: order.id, paymentProvider: MANUAL_KASPI_PROVIDER, paymentUrl: manualLink },
    });
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    return buildNeedsPaymentResult(
      updated ?? { ...order, paymentId: order.id, paymentUrl: manualLink },
      invitation,
      manualLink,
      planSku,
      promoCodeApplied
    );
  }

  const lockKey = invitation
    ? `checkout_pay:${invitation.id}:${planSku}`
    : `checkout_pay:agency:${user.id}`;
  await prisma.$executeRaw`SELECT pg_advisory_lock(hashtext(${lockKey}))`;

  try {
    const freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
    if (!freshOrder || freshOrder.status !== 'pending') {
      throw new ApiError('validation_error', 'Заказ недоступен для оплаты', 400);
    }

    if (freshOrder.paymentId) {
      return buildNeedsPaymentResult(
        freshOrder,
        invitation,
        resolveOrderPaymentUrl(freshOrder),
        planSku
      );
    }

    const provider = getPaymentProvider(providerName);
    if (!user.phone) {
      throw new ApiError(
        'phone_required',
        'Для оплаты нужен номер телефона. Укажите его в настройках.',
        400
      );
    }
    let payment;
    try {
      payment = await provider.createPayment({
        orderId: freshOrder.id,
        amountKzt: chargeAmount,
        description,
        customerPhone: user.phone,
        successUrl: `${appUrl}/api/orders/${freshOrder.id}/success`,
        failUrl,
      });
    } catch (error) {
      if (error instanceof KaspiPaymentError) {
        throw new ApiError('payment_provider_error', error.message, 502);
      }
      if (error instanceof Error && error.message.includes('Kaspi Pay не настроен')) {
        throw new ApiError('payment_not_configured', error.message, 503);
      }
      // Anything else here is a transport-level failure talking to the
      // provider (DNS/network/timeout, or a response shape the provider
      // client didn't anticipate) — not something the user caused. Without
      // this catch-all it propagates as a raw Error past apiErrorResponse's
      // ApiError check and renders as a bare "Внутренняя ошибка сервера"
      // with no indication payment was even involved.
      console.error('[checkout] payment provider transport error:', error);
      throw new ApiError(
        'payment_provider_error',
        'Не удалось связаться с платёжной системой. Попробуйте ещё раз через пару минут.',
        502
      );
    }

    const updated = await prisma.order.updateMany({
      where: { id: freshOrder.id, paymentId: null },
      data: {
        paymentId: payment.paymentId,
        paymentProvider: providerName,
        paymentUrl: payment.paymentUrl,
      },
    });

    if (updated.count === 0) {
      const refreshed = await prisma.order.findUnique({ where: { id: freshOrder.id } });
      if (refreshed?.paymentId) {
        return buildNeedsPaymentResult(
          refreshed,
          invitation,
          resolveOrderPaymentUrl(refreshed),
          planSku
        );
      }
      throw new ApiError('validation_error', 'Не удалось сохранить платёжную сессию', 500);
    }

    return buildNeedsPaymentResult(freshOrder, invitation, payment.paymentUrl, planSku);
  } finally {
    await prisma.$executeRaw`SELECT pg_advisory_unlock(hashtext(${lockKey}))`;
  }
}
