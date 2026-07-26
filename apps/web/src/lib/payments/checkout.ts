import { Prisma } from '@prisma/client';

import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import {
  assertPaidPlanSku,
  getInvitationPricing,
  resolvePlanCheckoutAmount,
} from '@/lib/invitations/invitation-pricing';
import { getPaymentProvider } from '@/lib/payments';
import { KaspiPaymentError } from '@/lib/payments/kaspi-errors';
import { isStalePendingOrder } from '@/lib/payments/pricing-integrity';
import type { SessionUser } from '@/lib/shared/api';
import {
  resolveCheckoutProvider,
  type PaymentProviderName,
} from '@/lib/payments/payment-provider-config';
import { publishInvitationIfDraft } from '@/lib/invitations/invitation-publish';
import {
  AGENCY_DURATION_DAYS,
  getPlanDefinition,
  type PaidPlanSku,
} from '@/lib/entitlements';

export interface CheckoutResult {
  published: boolean;
  needsPayment: boolean;
  paymentUrl: string | null;
  publicUrl: string | null;
  orderId: string | null;
  amountKzt: number;
  invitationId: string | null;
  slug: string | null;
  planSku: PaidPlanSku | null;
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
  planSku: PaidPlanSku
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

export type CheckoutIntent = 'publish' | 'pay' | 'plan';

/**
 * Checkout flow:
 * - publish: freemium publish with watermark
 * - pay / plan: create/resume order for planSku (standard|premium|agency)
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
  const intent = options.intent ?? 'publish';
  const planSku = assertPaidPlanSku(options.planSku);
  const planDef = getPlanDefinition(planSku);
  const providerName = resolveCheckoutProvider(options.provider);

  // Agency can be purchased without an invitation.
  if (intent === 'plan' && planSku === 'agency') {
    return checkoutAgency(user, {
      appUrl: options.appUrl,
      providerName,
      planSku,
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
    // Already unlocked — allow upgrade if requesting higher plan
    if (intent === 'pay' || intent === 'plan') {
      const currentRank = getPlanDefinition(pricing.entitlements.planSku).rank;
      if (planDef.rank <= currentRank) {
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
    } else {
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
  }

  if (intent === 'publish') {
    await publishInvitationIfDraft(invitation.id);
    return {
      published: true,
      needsPayment: unpaid,
      paymentUrl: null,
      publicUrl,
      orderId: null,
      amountKzt: pricing.priceKzt,
      invitationId: invitation.id,
      slug: invitation.slug,
      planSku: unpaid ? 'standard' : null,
    };
  }

  // intent pay | plan (invitation-level)
  if (!pricing.templateId) {
    throw new ApiError(
      'validation_error',
      'Не удалось определить шаблон. Выберите шаблон заново из каталога.',
      400
    );
  }

  const amountKzt = resolvePlanCheckoutAmount(planSku, undefined);
  // Prefer template override only for standard
  const chargeAmount =
    planSku === 'standard'
      ? pricing.priceKzt
      : amountKzt;

  const checkoutState = await prisma.$transaction(async (tx) => {
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

    if (!pendingOrder && planSku === 'standard') {
      pendingOrder = await tx.order.findFirst({
        where: {
          invitationId: invitation.id,
          status: 'pending',
          orderType: 'self',
          planSku: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

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
            eventType: invitation.eventType,
            status: 'pending',
            orderType: 'self',
            paymentProvider: providerName,
            planSku,
            planScope: 'invitation',
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
          planScope: 'invitation',
          amountKzt: chargeAmount,
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
    description: `QazShaqyru ${planSku}: «${pricing.templateNameRu}»`,
    failUrl: `${options.appUrl}/invitations/${invitation.id}?payment=failed`,
  });
}

async function checkoutAgency(
  user: SessionUser,
  options: {
    appUrl: string;
    providerName: PaymentProviderName;
    planSku: PaidPlanSku;
  }
): Promise<CheckoutResult> {
  const { providerName, planSku, appUrl } = options;
  const amountKzt = getPlanDefinition(planSku).priceKzt;

  // Need a templateId for Order FK — use any active template
  const template = await prisma.template.findFirst({
    where: { isActive: true },
    select: { id: true, nameRu: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (!template) {
    throw new ApiError('validation_error', 'Нет активных шаблонов для оформления тарифа', 500);
  }

  const checkoutState = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`checkout:agency:${user.id}`}))`;

    let pendingOrder = await tx.order.findFirst({
      where: {
        userId: user.id,
        status: 'pending',
        orderType: 'self',
        planSku: 'agency',
        invitationId: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingOrder && pendingOrder.amountKzt !== amountKzt) {
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
          amountKzt,
          customerPhone: user.phone,
          customerName: user.name,
          status: 'pending',
          orderType: 'self',
          paymentProvider: providerName,
          planSku: 'agency',
          planScope: 'user',
          planDurationDays: AGENCY_DURATION_DAYS,
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
    planSku,
    chargeAmount: amountKzt,
    description: `QazShaqyru Agency — ${AGENCY_DURATION_DAYS} дней`,
    failUrl: `${appUrl}/dashboard?payment=failed`,
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
  planSku: PaidPlanSku;
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
