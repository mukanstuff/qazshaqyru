import prisma from '@/lib/shared/db';
import { completeOrderPayment } from '@/lib/payments/order-completion';
import { parseKaspiAmountTyiyn } from '@/lib/payments/payment-amount';

export type PaymentSyncResult =
  | { status: 'paid'; invitationId: string | null }
  | { status: 'pending' }
  | { status: 'failed' }
  | { status: 'not_found' }
  | { status: 'unauthorized' };

export interface ReconcilePendingPaymentsResult {
  scanned: number;
  paid: number;
  stillPending: number;
}

type ProviderPaidResult = { paidAmountKzt: number };

/**
 * Poll payment provider when webhook is delayed.
 */
export async function syncOrderPaymentStatus(
  orderId: string,
  userId: string
): Promise<PaymentSyncResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      amountKzt: true,
      paymentProvider: true,
      paymentId: true,
      invitationId: true,
    },
  });

  if (!order || order.userId !== userId) {
    return { status: 'not_found' };
  }

  if (order.status === 'paid') {
    return { status: 'paid', invitationId: order.invitationId };
  }

  if (order.status === 'cancelled') {
    return { status: 'failed' };
  }

  if (order.status !== 'pending') {
    return { status: 'not_found' };
  }

  if (!order.paymentProvider || !order.paymentId) {
    return { status: 'pending' };
  }

  if (order.paymentProvider === 'kaspi' && process.env.KASPI_API_KEY) {
    const paid = await trySyncKaspiPayment(order.paymentId, order.id);
    if (paid) {
      const result = await completeOrderPayment(order.id, {
        expectedProvider: 'kaspi',
        paidAmountKzt: paid.paidAmountKzt,
      });
      if (result.ok) {
        return { status: 'paid', invitationId: result.invitationId };
      }
    }
  }

  if (order.paymentProvider === 'freedom' && process.env.FREEDOM_PAY_ENABLED === 'true' && process.env.FREEDOM_API_KEY) {
    const paid = await trySyncFreedomPayment(order.paymentId, order.id);
    if (paid) {
      const result = await completeOrderPayment(order.id, {
        expectedProvider: 'freedom',
        paidAmountKzt: paid.paidAmountKzt,
      });
      if (result.ok) {
        return { status: 'paid', invitationId: result.invitationId };
      }
    }
  }

  return { status: 'pending' };
}

/**
 * Reconcile stale pending orders in batch (for cron/worker use).
 */
export async function reconcilePendingPayments(
  limit = 100,
  syncFn: typeof syncOrderPaymentStatus = syncOrderPaymentStatus
): Promise<ReconcilePendingPaymentsResult> {
  const orders = await prisma.order.findMany({
    where: {
      status: 'pending',
      orderType: 'self',
      paymentProvider: { in: ['kaspi', 'freedom'] },
      paymentId: { not: null },
    },
    select: {
      id: true,
      userId: true,
    },
    orderBy: { createdAt: 'asc' },
    take: Math.max(1, Math.min(limit, 500)),
  });

  let paid = 0;
  let stillPending = 0;
  for (const order of orders) {
    if (!order.userId) {
      stillPending += 1;
      continue;
    }
    const result = await syncFn(order.id, order.userId);
    if (result.status === 'paid') {
      paid += 1;
    } else if (result.status === 'pending') {
      stillPending += 1;
    }
  }

  return {
    scanned: orders.length,
    paid,
    stillPending,
  };
}

async function trySyncKaspiPayment(
  paymentId: string,
  orderId: string
): Promise<ProviderPaidResult | null> {
  const apiUrl = process.env.KASPI_API_URL || 'https://pay.kaspi.kz/api/v1';
  const apiKey = process.env.KASPI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'success' && data.status !== 'paid') return null;
    if (typeof data.order_id === 'string' && data.order_id !== orderId) return null;

    const paidAmountKzt = parseKaspiAmountTyiyn(data.amount);
    if (paidAmountKzt === null) return null;

    return { paidAmountKzt };
  } catch {
    return null;
  }
}

/** Freedom Pay poll — extend when API credentials are available. */
async function trySyncFreedomPayment(
  paymentId: string,
  orderId: string
): Promise<ProviderPaidResult | null> {
  const apiUrl = process.env.FREEDOM_API_URL;
  const apiKey = process.env.FREEDOM_API_KEY;
  if (!apiUrl || !apiKey) return null;

  try {
    const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'paid' && data.status !== 'success') return null;
    if (typeof data.order_id === 'string' && data.order_id !== orderId) return null;

    const rawAmount = data.amount_kzt ?? data.amount;
    const paidAmountKzt =
      typeof rawAmount === 'number' && Number.isFinite(rawAmount)
        ? Math.round(rawAmount)
        : parseKaspiAmountTyiyn(rawAmount);
    if (paidAmountKzt === null) return null;

    return { paidAmountKzt };
  } catch {
    return null;
  }
}
