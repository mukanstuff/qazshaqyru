'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Props {
  orderId: string;
  onReopen: () => void;
  busy: boolean;
}

/**
 * "Your payment is being processed."
 *
 * Shown wherever the hub would otherwise ask for money again. It lived inline
 * in one branch of the hero's CTA chain — the branch that only renders while
 * the invitation is still unpublished. Since publishing is free, a customer who
 * published first and paid afterwards never reached that branch: the hub showed
 * no trace of their pending order and the lock card below went on offering
 * «Оплатить · 4 990 ₸», which is an invitation to pay for the same thing twice.
 */
export function HubPendingPay({ orderId, onReopen, busy }: Props) {
  const { t } = useI18n();
  return (
    <div className="hub-pending-pay">
      <p className="hub-pending-pay-title">
        <Loader2 size={14} className="hub-pending-pay-spinner" aria-hidden="true" />
        {t('invitation.hub.pendingPayTitle')}
      </p>
      <p className="hub-pending-pay-desc">{t('invitation.hub.pendingPayDesc')}</p>
      <p className="hub-pending-pay-order">
        {t('invitation.hub.pendingPayOrder', { id: orderId.slice(0, 8) })}
      </p>
      <button
        type="button"
        className="hub-btn"
        style={{ marginTop: 8 }}
        onClick={onReopen}
        disabled={busy}
      >
        {t('invitation.hub.pendingPayReopen')}
      </button>
    </div>
  );
}
