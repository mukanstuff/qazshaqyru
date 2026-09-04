'use client';

import { useEffect, useState } from 'react';

/**
 * Is there a payment for this invitation waiting to be confirmed?
 *
 * Manual Kaspi has no gateway callback: the customer opens the pay link, types
 * the amount into the Kaspi app, and the owner marks the order paid by hand
 * (Telegram). That gap can be hours.
 *
 * The hub had no notion of it. Starting a payment created a pending Order and
 * then the page went back to showing the same "Оплатить · 3 990 ₸" button, with
 * nothing anywhere saying a payment was already in flight — so the obvious
 * reading for the customer is "it did not go through", and the obvious next
 * action is to pay a second time. (`PaymentPendingBanner` on the dashboard
 * polls exactly this endpoint; the hub simply never used it.)
 */
export interface PendingOrderInfo {
  id: string;
  amountKzt: number;
  createdAt: string;
}

const POLL_MS = 10_000;

export function usePendingOrder(invitationId: string, enabled: boolean) {
  const [order, setOrder] = useState<PendingOrderInfo | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/orders/pending', { credentials: 'include' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          orders?: Array<PendingOrderInfo & { invitationId: string | null }>;
          recentlyPaid?: Array<{ invitationId: string | null }>;
        };
        if (cancelled) return;

        const mine = (data.orders ?? []).find((o) => o.invitationId === invitationId) ?? null;
        setOrder(mine ? { id: mine.id, amountKzt: mine.amountKzt, createdAt: mine.createdAt } : null);

        // Confirmed while the page was open — reload so the whole hub flips to
        // its paid state instead of leaving a stale "waiting" strip behind.
        const justPaid = (data.recentlyPaid ?? []).some((o) => o.invitationId === invitationId);
        if (justPaid) window.location.reload();
      } catch {
        /* transient — the next tick retries */
      }
    };

    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [invitationId, enabled]);

  return order;
}
