'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkoutAgencyClient } from '@/lib/payments/checkout-client';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { formatKzt } from '@/lib/shared/format-price';
import { useI18n } from '@/i18n';

interface Props {
  hasActiveAgency: boolean;
  agencyExpiresAt: string | null;
}

/**
 * The Agency upsell on the dashboard and on `/agency`.
 *
 * Two things were wrong with it and both reached customers. Every string was
 * typed in Russian with no locale branch, on a screen that a Kazakh-language
 * account opens by default. And the card carried an internal positioning note —
 * "Managed «сделаем за вас» — upsell после оплаты. Не marketplace тойхан." —
 * which is a sentence written for the team, printed under the price.
 */
export function AgencyPlanCard({ hasActiveAgency, agencyExpiresAt }: Props) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = formatKzt(PLAN_CATALOG.agency.priceKzt);

  if (hasActiveAgency) {
    const until = agencyExpiresAt
      ? new Date(agencyExpiresAt).toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU')
      : '—';
    return (
      <Card className="border-us-accent/20 bg-us-ivory/80 shadow-us-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <div>
            <div className="font-semibold text-us-ink">{t('dashboard.agencyCard.activeTitle')}</div>
            <div className="text-us-ink-muted">
              {t('dashboard.agencyCard.activeUntil', { date: until })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-us-border bg-us-ivory/60 shadow-us-sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <div className="font-semibold text-us-ink">{t('dashboard.agencyCard.title')}</div>
          <div className="text-us-ink-muted">
            {t('dashboard.agencyCard.meta', { price })}
          </div>
          {error ? <div className="mt-1 text-us-accent">{error}</div> : null}
        </div>
        <Button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void checkoutAgencyClient()
              .then((c) => {
                if (c.paymentUrl) window.location.href = c.paymentUrl;
                else window.location.reload();
              })
              .catch((e) => {
                setError(e instanceof Error ? e.message : t('dashboard.agencyCard.error'));
                setBusy(false);
              });
          }}
        >
          {t('dashboard.agencyCard.cta')}
        </Button>
      </CardContent>
    </Card>
  );
}
