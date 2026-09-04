'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { getWhatsappHref } from '@/lib/site/legal-config';
import { formatKzt } from '@/lib/shared/format-price';

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string;
  paymentUrl: string;
  invitationTitle: string;
  amountKzt: number;
}

/**
 * Kaspi Pay has no self-serve merchant API — verified directly against
 * Kaspi's own partner docs, which cover legal/tariff terms only, nothing
 * technical (see the payments research in this session's history). Every
 * "Kaspi Pay REST API" is a third-party wrapper business, not Kaspi. So the
 * only thing actually reachable today, matching what other local sites do,
 * is the site owner's own free кассир pay link (pay.kaspi.kz/pay/... from
 * "Удалённая оплата" in the Kaspi Pay app): the customer types the amount
 * themselves, then confirms.
 *
 * "Я оплатил" pings the site owner on Telegram (Подтвердить/Отклонить
 * buttons — see /api/telegram/webhook) so they can approve from their
 * phone after checking the transfer in their own Kaspi Pay app, instead of
 * needing to open /admin/orders on a computer. This panel then polls
 * /api/orders/[id]/sync so it unlocks the moment they tap approve, without
 * the customer needing to reload anything themselves.
 */
export function HubSheetManualPay({
  open,
  onClose,
  orderId,
  paymentUrl,
  invitationTitle,
  amountKzt,
}: Props) {
  const { t, locale } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [notifyState, setNotifyState] = useState<'idle' | 'sent' | 'failed'>('idle');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const shortId = orderId.slice(0, 8);

  const whatsappMessage =
    locale === 'kz'
      ? `Сәлеметсіз бе! «${invitationTitle}» шақыруы үшін төлем жасадым. Тапсырыс ID: ${shortId}`
      : `Здравствуйте! Оплатил приглашение «${invitationTitle}». ID заказа: ${shortId}`;

  const handleIPaid = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/notify-manual-payment`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setNotifyState(res.ok && data.notified ? 'sent' : 'failed');
    } catch {
      setNotifyState('failed');
    }
  };

  // Poll for the owner's Telegram approval (or the /admin/orders fallback)
  // so the page unlocks itself the moment the order flips to paid.
  useEffect(() => {
    if (!confirming) return;
    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/sync`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (data.status === 'paid') {
          if (pollTimer.current) clearInterval(pollTimer.current);
          window.location.reload();
        }
      } catch {
        /* keep polling — a transient network error shouldn't stop it */
      }
    }, 4000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [confirming, orderId]);

  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.manualPay.title')}
      subtitle={t('invitation.hub.manualPay.subtitle', { amount: formatKzt(amountKzt) })}
    >
      <div className="hub-url-box">
        <span className="hub-url-text">ID: {shortId}</span>
      </div>

      {!confirming ? (
        <div className="hub-share-buttons">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-btn hub-btn--primary"
          >
            <ExternalLink size={16} aria-hidden="true" />
            {t('invitation.hub.manualPay.openKaspi')}
          </a>
          <button type="button" className="hub-btn" onClick={handleIPaid}>
            {t('invitation.hub.manualPay.iPaid')}
          </button>
        </div>
      ) : (
        <div className="hub-share-buttons">
          {notifyState === 'sent' ? (
            <p className="hub-note" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} aria-hidden="true" />
              {t('invitation.hub.manualPay.notifiedOwner')}
            </p>
          ) : null}
          <a
            href={getWhatsappHref(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-btn hub-btn--primary"
          >
            <MessageCircle size={16} aria-hidden="true" />
            {t('invitation.hub.manualPay.confirmWhatsapp')}
          </a>
          <p className="hub-note">{t('invitation.hub.manualPay.managerHint')}</p>
        </div>
      )}
    </HubSheet>
  );
}
