'use client';

import { Check } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';
import { PricingFeatureFaq } from './PricingFeatureFaq';
import { PricingValueCompare } from './PricingValueCompare';
import { formatPlanPriceKzt, planBillingSuffix } from './pricing-utils';

const TIMELINE_KEYS = ['timeline1', 'timeline2', 'timeline3'] as const;

const FAMILY_PLANS = [
  {
    sku: 'standard' as const,
    nameKey: 'standardName',
    descKey: 'standardDesc',
    ctaKey: 'standardCta',
    perkKeys: ['standardPerk1', 'standardPerk2', 'standardPerk3', 'standardPerk4'],
    highlight: true,
  },
  {
    sku: 'premium' as const,
    nameKey: 'premiumName',
    descKey: 'premiumDesc',
    ctaKey: 'premiumCta',
    perkKeys: ['premiumPerk1', 'premiumPerk2', 'premiumPerk3'],
    highlight: false,
  },
];

/** Full pricing page — freemium timeline, family plans, agency track, value compare, FAQ. */
export function PricingPageContent() {
  const { t } = useI18n();
  const agencyPrice = formatPlanPriceKzt('agency');
  const agencyPeriod = planBillingSuffix('agency');

  return (
    <div className="space-y-20" data-testid="pricing-page-content">
      <section aria-labelledby="pricing-timeline-heading">
        <h2 id="pricing-timeline-heading" className="sr-only">
          {t('landing.v2.pricing.page.timelineHeading')}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {TIMELINE_KEYS.map((key, index) => (
            <li
              key={key}
              className="relative rounded-2xl border border-black/[0.06] bg-[#faf8f5] px-5 py-6"
            >
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-us-accent text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="font-display text-xl text-us-ink">
                {t(`landing.v2.pricing.teaser.${key}Title`)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-us-ink-muted">
                {t(`landing.v2.pricing.teaser.${key}Desc`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pricing-family-heading">
        <div className="mb-8 text-center">
          <p className="us-overline mb-3">{t('landing.v2.pricing.page.familyOverline')}</p>
          <h2 id="pricing-family-heading" className="font-display text-3xl text-us-ink">
            {t('landing.v2.pricing.page.familyTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-us-ink-muted md:text-base">
            {t('landing.v2.pricing.page.familySubtitle')}
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {FAMILY_PLANS.map((plan) => {
            const def = PLAN_CATALOG[plan.sku];
            const price = formatPlanPriceKzt(plan.sku);
            return (
              <article
                key={plan.sku}
                className={cn(
                  'flex flex-col rounded-2xl border p-6',
                  plan.highlight
                    ? 'us-glass border-us-accent/35 shadow-us-md ring-1 ring-us-accent/20'
                    : 'border-black/[0.06] bg-white shadow-sm',
                )}
                data-testid={`pricing-plan-${plan.sku}`}
              >
                {plan.highlight ? (
                  <p className="mb-3 inline-flex w-fit rounded-full bg-us-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    {t('landing.v2.pricing.page.familyRecommended')}
                  </p>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-widest text-us-ink-muted">
                  {t(`landing.v2.pricing.${plan.nameKey}`)}
                </p>
                <div className="mt-1 font-display text-4xl text-us-ink">
                  {price}
                  <span className="ml-1 text-lg text-us-ink-muted">₸</span>
                </div>
                <p className="mt-2 text-sm text-us-ink-muted">
                  {t(`landing.v2.pricing.${plan.descKey}`)}
                </p>
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.perkKeys.map((perkKey) => (
                    <li key={perkKey} className="flex items-start gap-2 text-sm text-us-ink-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-us-accent" aria-hidden />
                      <span>{t(`landing.v2.pricing.${perkKey}`)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlight ? 'default' : 'outline'}
                  className="mt-6 min-h-11 w-full"
                >
                  <LocaleLink href="/templates">{t(`landing.v2.pricing.${plan.ctaKey}`)}</LocaleLink>
                </Button>
                <p className="mt-3 text-center text-xs text-us-ink-muted">
                  {def.billingPeriod === 'one_time'
                    ? t('landing.v2.pricing.page.oneTimeNote')
                    : t('landing.v2.pricing.page.monthlyNote')}
                </p>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-us-ink-muted">
          {t('landing.v2.pricing.page.freeReminder')}
        </p>
      </section>

      <section
        aria-labelledby="pricing-agency-heading"
        className="rounded-[2rem] border border-us-accent/20 bg-us-accent px-6 py-10 text-us-cream md:px-10"
        data-testid="pricing-agency-section"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-us-gold">
              {t('landing.v2.pricing.page.agencyOverline')}
            </p>
            <h2 id="pricing-agency-heading" className="mt-2 font-display text-3xl">
              {t('landing.v2.pricing.page.agencyTitle')}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {t('landing.v2.pricing.page.agencySubtitle')}
            </p>
            <p className="mt-4 font-display text-3xl text-white">
              {agencyPrice}
              <span className="ml-1 text-lg text-white/70">₸{agencyPeriod}</span>
            </p>
            <ul className="mt-4 space-y-2">
              {(['agencyPerk1', 'agencyPerk2', 'agencyPerk3'] as const).map((perkKey) => (
                <li key={perkKey} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-us-gold" aria-hidden />
                  <span>{t(`landing.v2.pricing.${perkKey}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button
            asChild
            variant="secondary"
            className="min-h-11 shrink-0 bg-white px-8 text-us-accent hover:bg-white/90"
          >
            <LocaleLink href="/agency">{t('landing.v2.pricing.agencyCta')}</LocaleLink>
          </Button>
        </div>
      </section>

      <PricingValueCompare />

      <PricingFeatureFaq />
    </div>
  );
}
