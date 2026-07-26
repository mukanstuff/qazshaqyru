'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PendingOrder {
  id: string;
  invitationId: string | null;
  amountKzt: number;
  createdAt: string;
}

interface RecentlyPaidOrder {
  id: string;
  invitationId: string | null;
  amountKzt: number;
  paidAt: string | null;
}

interface Props {
  initialPending?: boolean;
  alwaysPoll?: boolean;
}

export function PaymentPendingBanner({ initialPending = false, alwaysPoll = false }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(initialPending);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  const resumePayment = useCallback(async (invitationId: string) => {
    setResumingId(invitationId);
    setResumeError(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'checkout failed');
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      if (data.published && data.invitationId) {
        router.push(`/invitations/${data.invitationId}?published=1`);
      }
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : t('errors.tryAgain'));
    } finally {
      setResumingId(null);
    }
  }, [router, t]);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      try {
        const res = await fetch('/api/orders/pending');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const pending: PendingOrder[] = data.orders ?? [];
        const recentlyPaid: RecentlyPaidOrder[] = data.recentlyPaid ?? [];

        setOrders(pending);
        setLoading(false);

        if (
          !redirectedRef.current &&
          pending.length === 0 &&
          recentlyPaid.length > 0 &&
          recentlyPaid[0].invitationId
        ) {
          redirectedRef.current = true;
          router.push(`/invitations/${recentlyPaid[0].invitationId}?published=1`);
          return;
        }

        for (const order of pending) {
          try {
            const syncRes = await fetch(`/api/orders/${order.id}/sync`, { method: 'POST' });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.status === 'paid' && syncData.invitationId && !redirectedRef.current) {
                redirectedRef.current = true;
                router.push(`/invitations/${syncData.invitationId}?published=1`);
                return;
              }
            }
          } catch {
            // Non-fatal — webhook may still arrive
          }
        }

        if (pending.length === 0 && interval) {
          clearInterval(interval);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    void poll();
    if (initialPending || alwaysPoll) {
      interval = setInterval(poll, 5000);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [initialPending, alwaysPoll, router]);

  if (!initialPending && !alwaysPoll && orders.length === 0) return null;

  if (loading && orders.length === 0) {
    return (
      <Card className="border-us-cta/40 bg-us-cta/5">
        <CardContent className="flex items-center gap-3 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-us-accent" />
          <span className="font-body text-sm text-us-ink">{t('dashboard.paymentPending.checking')}</span>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) return null;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id} className="border-us-cta/40 bg-us-cta/5">
          <CardContent className="space-y-3 p-4">
            <p className="font-display text-base font-medium text-us-ink">
              {t('dashboard.paymentPending.title')}
            </p>
            <p className="font-body text-sm text-us-ink-muted">
              {t('dashboard.paymentPending.description')}
            </p>
            <div className="flex flex-wrap gap-2">
              {order.invitationId ? (
                <>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => void resumePayment(order.invitationId!)}
                    disabled={resumingId === order.invitationId}
                  >
                    {resumingId === order.invitationId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('dashboard.paymentPending.resumePayment')}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/invitations/${order.invitationId}`}>
                      {t('dashboard.paymentPending.openInvitation')}
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="font-body text-sm text-us-ink-muted">
                  {t('dashboard.paymentPending.wait')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {resumeError && (
        <p className="font-body text-sm text-us-danger" role="alert">
          {resumeError}
        </p>
      )}
    </div>
  );
}
