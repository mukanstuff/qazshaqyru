'use client';

import { Check, X } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';
import { formatPlanPriceKzt } from './pricing-utils';

const COLUMNS = [
  { key: 'print', highlight: false },
  { key: 'digital', highlight: true },
  { key: 'designer', highlight: false },
] as const;

const ROW_KEYS = ['1', '2', '3'] as const;

/** Value comparison: print vs QazShaqyru vs designer — not tier cards. */
export function PricingValueCompare() {
  const { t } = useI18n();
  const digitalPrice = formatPlanPriceKzt('standard');

  return (
    <div className="mx-auto max-w-5xl" data-testid="pricing-value-compare">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl text-us-ink md:text-3xl">
          {t('landing.v2.pricingCompare.competitorTitle')}
        </h2>
        <p className="mt-2 text-sm text-us-ink-muted md:text-base">
          {t('landing.v2.pricingCompare.competitorSubtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map(({ key, highlight }) => {
          const priceKey = `${key}Price` as const;
          const labelKey = `${key}Label` as const;
          const timeKey = key === 'digital' ? 'digitalNote' : `${key}Time`;
          const displayPrice =
            key === 'digital'
              ? t('landing.v2.pricing.teaser.heroPrice', { price: digitalPrice })
              : t(`landing.v2.pricingCompare.${priceKey}`);

          return (
            <article
              key={key}
              className={cn(
                'flex flex-col rounded-2xl border p-5',
                highlight
                  ? 'border-us-accent/35 bg-us-accent/[0.04] shadow-us-md ring-1 ring-us-accent/15'
                  : 'border-black/[0.06] bg-white shadow-sm',
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-us-ink-muted">
                {t(`landing.v2.pricingCompare.${labelKey}`)}
              </p>
              <p
                className={cn(
                  'mt-2 font-display text-2xl',
                  highlight ? 'text-us-accent' : 'text-us-ink',
                )}
              >
                {displayPrice}
              </p>
              <p className="mt-1 text-sm text-us-ink-muted">
                {t(`landing.v2.pricingCompare.${timeKey}`)}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {ROW_KEYS.map((row) => {
                  const rowText = t(`landing.v2.pricingCompare.${key}${row}`);
                  const isPositive = key === 'digital';
                  return (
                    <li key={row} className="flex items-start gap-2 text-sm text-us-ink-muted">
                      {isPositive ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-us-accent" aria-hidden />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-us-ink-muted/50" aria-hidden />
                      )}
                      <span>{rowText}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <LocaleLink
          href="/invitations/edit"
          className="inline-flex text-sm font-semibold text-us-accent hover:underline"
        >
          {t('landing.v2.pricingCompare.cta')}
        </LocaleLink>
      </div>
    </div>
  );
}
