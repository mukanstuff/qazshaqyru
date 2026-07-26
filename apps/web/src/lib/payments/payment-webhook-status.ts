/**
 * Normalizes provider-specific webhook statuses into actions the app can take.
 * Intermediate statuses (pending, processing) must not cancel orders.
 */

export type WebhookPaymentAction = 'complete' | 'cancel' | 'ignore';

export interface ParsedWebhookPayment {
  orderId: string;
  action: WebhookPaymentAction;
  paidAmountKzt?: number;
  paymentId?: string;
}

const KASPI_FINAL_SUCCESS = new Set(['success', 'paid', 'completed']);
const KASPI_FINAL_FAILURE = new Set(['failed', 'cancelled', 'canceled', 'expired', 'declined']);

const FREEDOM_FINAL_SUCCESS = new Set(['paid', 'success', 'completed']);
const FREEDOM_FINAL_FAILURE = new Set(['failed', 'cancelled', 'canceled', 'expired', 'declined']);

function classifyStatus(
  status: string | undefined,
  success: Set<string>,
  failure: Set<string>
): WebhookPaymentAction {
  const normalized = (status ?? '').toLowerCase();
  if (success.has(normalized)) return 'complete';
  if (failure.has(normalized)) return 'cancel';
  return 'ignore';
}

export function parseKaspiWebhookPayload(data: {
  order_id?: string;
  status?: string;
  amount?: number;
  payment_id?: string;
  id?: string;
}): ParsedWebhookPayment | null {
  if (!data.order_id) return null;

  const action = classifyStatus(data.status, KASPI_FINAL_SUCCESS, KASPI_FINAL_FAILURE);
  const paidAmountKzt =
    typeof data.amount === 'number' ? Math.round(data.amount / 100) : undefined;

  if (action === 'complete' && paidAmountKzt === undefined) {
    return null;
  }

  const paymentId = data.payment_id ?? data.id;

  return {
    orderId: data.order_id,
    action,
    ...(paymentId ? { paymentId } : {}),
    ...(paidAmountKzt !== undefined ? { paidAmountKzt } : {}),
  };
}

export function parseFreedomWebhookPayload(data: {
  order_id?: string;
  status?: string;
  amount_kzt?: number;
  amount?: number;
  payment_id?: string;
  id?: string;
}): ParsedWebhookPayment | null {
  if (!data.order_id) return null;

  const action = classifyStatus(data.status, FREEDOM_FINAL_SUCCESS, FREEDOM_FINAL_FAILURE);
  const raw = data.amount_kzt ?? data.amount;
  const paidAmountKzt = typeof raw === 'number' ? Math.round(raw) : undefined;

  if (action === 'complete' && paidAmountKzt === undefined) {
    return null;
  }

  const paymentId = data.payment_id ?? data.id;

  return {
    orderId: data.order_id,
    action,
    ...(paymentId ? { paymentId } : {}),
    ...(paidAmountKzt !== undefined ? { paidAmountKzt } : {}),
  };
}
