export interface CheckoutResponse {
  success: boolean;
  published: boolean;
  needsPayment: boolean;
  paymentUrl: string | null;
  publicUrl: string | null;
  orderId: string | null;
  amountKzt: number;
  invitationId: string | null;
  slug: string | null;
  planSku?: string | null;
  message?: string;
  /** True when paymentUrl is a manual Kaspi transfer link — the customer
   *  types the amount themselves and confirms over WhatsApp, no automated
   *  redirect-back. The caller must show the confirm-by-WhatsApp step
   *  instead of just navigating straight to paymentUrl. */
  manual?: boolean;
  /** Code the server actually applied — null when none was sent, or the one
   *  sent turned out to be unusable. Never assume the code you sent stuck. */
  promoCode?: string | null;
  discountKzt?: number;
}

import type { PaymentProviderName } from '@/lib/payments/payment-provider-config';
import type { PaidPlanSku } from '@/lib/entitlements';

export async function checkoutInvitationClient(
  invitationId: string,
  providerOrOptions?:
    | PaymentProviderName
    | {
        provider?: PaymentProviderName;
        intent?: 'publish' | 'pay' | 'plan';
        planSku?: PaidPlanSku;
        promoCode?: string | null;
      }
): Promise<CheckoutResponse> {
  const options =
    typeof providerOrOptions === 'string' || providerOrOptions === undefined
      ? { provider: providerOrOptions, intent: 'pay' as const }
      : providerOrOptions;

  const res = await fetch(`/api/invitations/${invitationId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(options.provider ? { provider: options.provider } : {}),
      intent: options.intent ?? 'pay',
      ...(options.planSku ? { planSku: options.planSku } : {}),
      ...(options.promoCode ? { promoCode: options.promoCode } : {}),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as CheckoutResponse & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || 'Не удалось оформить публикацию');
  }

  return data;
}

/** Agency subscription — uses a dedicated endpoint when no invitation. */
export async function checkoutAgencyClient(options?: {
  provider?: PaymentProviderName;
}): Promise<CheckoutResponse> {
  const res = await fetch('/api/plans/agency/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(options?.provider ? { provider: options.provider } : {}),
      intent: 'plan',
      planSku: 'agency',
    }),
  });

  const data = (await res.json().catch(() => ({}))) as CheckoutResponse & {
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || 'Не удалось оформить Agency');
  }

  return data;
}
