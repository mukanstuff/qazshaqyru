'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkoutAgencyClient } from '@/lib/payments/checkout-client';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';

interface Props {
  hasActiveAgency: boolean;
  agencyExpiresAt: string | null;
}

export function AgencyPlanCard({ hasActiveAgency, agencyExpiresAt }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = PLAN_CATALOG.agency.priceKzt.toLocaleString('ru-RU');

  if (hasActiveAgency) {
    return (
      <Card className="border-us-accent/20 bg-us-ivory/80 shadow-us-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <div>
            <div className="font-semibold text-us-ink">Agency активен</div>
            <div className="text-us-ink-muted">
              Безлимит до{' '}
              {agencyExpiresAt
                ? new Date(agencyExpiresAt).toLocaleDateString('ru-RU')
                : '—'}
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
          <div className="font-semibold text-us-ink">Agency — тойханы и организаторы</div>
          <div className="text-us-ink-muted">
            {price} ₸/мес · безлимит · список гостей · свои ссылки · портал менеджеру
          </div>
          <p className="mt-1 text-xs text-us-ink-muted">
            Managed «сделаем за вас» — upsell после оплаты. Не marketplace тойхан.
          </p>
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
                setError(e instanceof Error ? e.message : 'Ошибка');
                setBusy(false);
              });
          }}
        >
          Оформить Agency
        </Button>
      </CardContent>
    </Card>
  );
}
