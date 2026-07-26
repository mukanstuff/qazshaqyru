'use client';

import { ArrowRight, Check } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { formatPlanPriceKzt } from './pricing-utils';

const TIMELINE_KEYS = ['timeline1', 'timeline2', 'timeline3'] as const;
const BULLET_KEYS = ['bullet1', 'bullet2', 'bullet3'] as const;

/** Short freemium pricing block for the landing — full details on /pricing. */
export function PricingTeaser() {
  const { t } = useI18n();
  const standardPrice = formatPlanPriceKzt('standard');

  return (
    <div className="mx-auto max-w-3xl text-center" data-testid="pricing-teaser">
      <div className="rounded-[2rem] border border-black/[0.06] bg-[#faf8f5] px-6 py-10 shadow-sm md:px-10 md:py-12">
        <p className="text-sm font-medium text-us-ink-muted">{t('landing.v2.pricing.teaser.freeNote')}</p>
        <p className="mt-2 font-display text-5xl text-us-ink md:text-6xl" data-testid="pricing-teaser-hero-price">
          <span className="text-us-accent">
            {t('landing.v2.pricing.teaser.heroPrice', { price: standardPrice })}
          </span>
        </p>
        <p className="mt-1 text-base text-us-ink-muted">{t('landing.v2.pricing.teaser.priceLabel')}</p>

        <ol className="mt-8 grid gap-4 text-left sm:grid-cols-3 sm:gap-3">
          {TIMELINE_KEYS.map((key, index) => (
            <li
              key={key}
              className="rounded-2xl border border-black/[0.05] bg-white px-4 py-4 shadow-sm"
            >
              <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-us-accent/10 text-sm font-semibold text-us-accent">
                {index + 1}
              </span>
              <p className="font-display text-base text-us-ink">
                {t(`landing.v2.pricing.teaser.${key}Title`)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-us-ink-muted">
                {t(`landing.v2.pricing.teaser.${key}Desc`)}
              </p>
            </li>
          ))}
        </ol>

        <ul className="mt-8 flex flex-col gap-2 text-left sm:mx-auto sm:max-w-md">
          {BULLET_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-us-ink-muted">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-us-accent" aria-hidden />
              <span>{t(`landing.v2.pricing.teaser.${key}`)}</span>
            </li>
          ))}
        </ul>

        <LocaleLink
          href="/pricing"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-us-accent hover:underline"
        >
          {t('landing.v2.pricing.teaser.allPlans')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </LocaleLink>
      </div>
      <p className="mt-4 text-xs text-us-ink-muted">
        {t('landing.v2.pricing.teaser.kaspiNote')}
      </p>
    </div>
  );
}
