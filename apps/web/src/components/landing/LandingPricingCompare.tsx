'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';

import { useI18n } from '@/i18n';

/** Simple pricing reminder — no competitor names on public surfaces. */
export function LandingPricingCompare() {
  const { t } = useI18n();

  return (
    <div
      data-testid="pricing-competitor-compare"
      className="mx-auto max-w-3xl rounded-[1.5rem] border border-black/[0.06] bg-white px-5 py-4 shadow-sm md:px-6 md:py-5"
    >
      <p className="font-display text-xl text-us-ink md:text-2xl">
        {t('landing.v2.pricingCompare.competitorTitle')}
      </p>
      <p className="mt-1 text-sm text-us-ink-muted">
        {t('landing.v2.pricingCompare.competitorSubtitle')}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-us-ink-muted">
        <span className="font-semibold text-us-accent">
          {t('landing.v2.pricingCompare.competitorUsPrice')}
        </span>
        {' · '}
        {t('landing.v2.pricingCompare.competitorUsNote')}
        {' · '}
        {t('landing.v2.pricingCompare.competitorUs1')}
      </p>
      <LocaleLink
        href="/invitations/edit"
        className="mt-4 inline-flex text-sm font-medium text-us-accent hover:underline"
      >
        {t('landing.v2.pricingCompare.cta')}
      </LocaleLink>
    </div>
  );
}
