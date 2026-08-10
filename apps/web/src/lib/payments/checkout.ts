import { Prisma } from '@prisma/client';

type PrismaTx = any;

import prisma from '@/lib/shared/db';
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
import { type LegacyPlanSku, type PaidPlanSku } from '@/lib/entitlements';

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
  order: { id: string; amountKzt: number },
  invitation: { id: string; slug: string } | null,
  paymentUrl: string | null,
  planSku: LegacyPlanSku | PaidPlanSku
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
  }
): Promise<CheckoutResult> {
  const intent = options.intent ?? 'pay';
  const providerName = resolveCheckoutProvider(options.provider);

  // Agency is purchased WITHOUT an invitation, so we can route it before requiring one.
  if (intent === 'agency' || (intent === 'plan' && options.planSku === 'agency')) {
    const routing = determineCheckout({
      intent,
      requestedPlanSku: options.planSku,
      // Agency doesn't charge a template price, but the routing API requires it.
      templatePriceKzt: 0,
      templateName: '',
    });
    return checkoutAgency(user, {
      appUrl: options.appUrl,
      providerName,
      routing,
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

  const publicUrl = `${options.appUrl.replace(/\/$/, '')}/i/${invitation.slug}`;
  const unpaid = pricing.entitlements.watermark;

  if (!unpaid && (intent === 'publish' || intent === 'pay' || intent === 'plan')) {
    // Already fully unlocked via template purchase or agency.
    // Per 2026-07-30 product model: paying template price = complete access.
    await publishInvitationIfDraft(invitation.id);
    return {
      published: true,
      needsPayment: false,
      paymentUrl: null,
      publicUrl,
      orderId: null,
      amountKzt: 0,
      invitationId: invitation.id,
      slug: invitation.slug,
      planSku: null,
    };
  }

  // HOTFIX H1: 'publish' (freemium without payment) is legacy.
  // Only allow for admin (internal / migration). Regular user path must use 'pay'.
  if (intent === 'publish') {
    if (!user.isAdmin) {
      throw new ApiError(
        'validation_error',
        'Публикация только после оплаты цены шаблона. Используйте intent: "pay".',
        400
      );
    }
    // Admin legacy path only — still charge the template price.
    const routing = determineCheckout({
      intent: 'publish',
      requestedPlanSku: options.planSku,
      templatePriceKzt: pricing.priceKzt,
      templateName: pricing.templateNameRu,
    });
    return runTemplateCheckout({
      invitation,
      user,
      options,
      pricing,
      providerName,
      routing,
      publicUrl,
    });
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

  const routing = determineCheckout({
    intent: 'pay',
    requestedPlanSku: options.planSku,
    templatePriceKzt: pricing.priceKzt,
    templateName: pricing.templateNameRu,
  });

  return runTemplateCheckout({
    invitation,
    user,
    options,
    pricing,
    providerName,
    routing,
    publicUrl,
  });
}

async function checkoutAgency(
  user: SessionUser,
  options: {
    appUrl: string;
    providerName: PaymentProviderName;
    routing: CheckoutRouting;
  }
): Promise<CheckoutResult> {
  const { providerName, routing, appUrl } = options;

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

    if (pendingOrder && pendingOrder.amountKzt !== routing.chargeAmountKzt) {
      await tx.order.update({
        where: { id: pendingOrder.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      pendingOrder = null;
    }

    if (pendingOrder?.paymentId && pendingOrder.paymentProvider) {
      return { order: pendingOrder, resumePayment: true as const };
    }

    let order = pendingOrder;
    if (!order) {
      order = await tx.order.create({
        data: {
          userId: user.id,
          templateId: template.id,
          invitationId: null,
          amountKzt: routing.chargeAmountKzt,
          customerPhone: user.phone,
          customerName: user.name,
          status: 'pending',
          orderType: 'self',
          paymentProvider: providerName,
          planSku: AGENCY_ORDER_PLAN_SKU,
          planScope: 'user',
          planDurationDays: routing.planDurationDays,
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
    chargeAmount: routing.chargeAmountKzt,
    description: routing.description,
    failUrl: `${appUrl}/dashboard?payment=failed`,
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
  };
  pricing: {
    templateId: string | null;
    priceKzt: number;
    templateNameRu: string;
  };
  providerName: PaymentProviderName;
  routing: CheckoutRouting;
  publicUrl: string;
}): Promise<CheckoutResult> {
  const { invitation, user, options, pricing, providerName, routing, publicUrl } = args;
  const chargeAmount = routing.chargeAmountKzt;
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
      pendingOrder = null;
    }

    if (pendingOrder?.paymentId && pendingOrder.paymentProvider) {
      return { order: pendingOrder, resumePayment: true as const };
    }

    let order = pendingOrder;
    if (!order) {
      try {
        order = await tx.order.create({
          data: {
            userId: user.id,
            templateId: pricing.templateId!,
            invitationId: invitation.id,
            amountKzt: chargeAmount,
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
    invitation,
    user,
    appUrl: options.appUrl,
    providerName,
    planSku,
    chargeAmount,
    description: routing.description,
    failUrl: `${options.appUrl}/invitations/${invitation.id}?payment=failed`,
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
  invitation: { id: string; slug: string } | null;
  user: SessionUser;
  appUrl: string;
  providerName: PaymentProviderName;
  planSku: LegacyPlanSku | PaidPlanSku;
  chargeAmount: number;
  description: string;
  failUrl: string;
}): Promise<CheckoutResult> {
  const {
    order,
    resumePayment,
    invitation,
    user,
    appUrl,
    providerName,
    planSku,
    chargeAmount,
    description,
    failUrl,
  } = params;

  if (resumePayment) {
    return buildNeedsPaymentResult(order, invitation, resolveOrderPaymentUrl(order), planSku);
  }

  if (order.paymentId && order.paymentProvider === 'mock') {
    return buildNeedsPaymentResult(order, invitation, resolveOrderPaymentUrl(order), planSku);
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
      throw error;
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
