'use client';

import { ArrowRight, Check } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';

interface PricingTeaserProps {
  minTemplatePriceKzt: number;
}

const TIMELINE_KEYS = ['timeline1', 'timeline2', 'timeline3'] as const;
const BULLET_KEYS = ['bullet1', 'bullet2', 'bullet3'] as const;

const TIMELINE_COLORS = ['#16A34A', '#F59E0B', '#F97316'];

/** Short pricing block for the landing — from {MIN} ₸ per invitation. */
export function PricingTeaser({ minTemplatePriceKzt }: PricingTeaserProps) {
  const { t } = useI18n();
  const formattedMin = minTemplatePriceKzt.toLocaleString('ru-RU');

  return (
    <div className="mx-auto max-w-3xl text-center" data-testid="pricing-teaser">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#1F3A2E]/10 bg-gradient-to-br from-white to-[#FFFBEB] px-6 py-10 shadow-lg md:px-10 md:py-12">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-[#F59E0B]/10 blur-3xl" aria-hidden />
        
        <p className="text-sm font-medium text-[#6B8A92]">{t('landing.v2.pricing.teaser.freeNote')}</p>
        <p className="mt-2 font-display text-5xl text-[#1F3A2E] md:text-6xl" data-testid="pricing-teaser-hero-price">
          <span className="text-[#16A34A]">
            {t('landing.v2.pricing.teaser.heroPrice', { price: formattedMin })}
          </span>
        </p>
        <p className="mt-1 text-base text-[#6B8A92]">{t('landing.v2.pricing.teaser.priceLabel')}</p>

        <ol className="relative mt-8 grid gap-4 text-left sm:grid-cols-3 sm:gap-3">
          {TIMELINE_KEYS.map((key, index) => (
            <li
              key={key}
              className="relative overflow-hidden rounded-2xl border border-[#1F3A2E]/8 bg-white px-4 py-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span 
                className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: TIMELINE_COLORS[index] }}
              >
                {index + 1}
              </span>
              <p className="font-display text-base text-[#1F3A2E]">
                {t(`landing.v2.pricing.teaser.${key}Title`)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#6B8A92]">
                {t(`landing.v2.pricing.teaser.${key}Desc`)}
              </p>
            </li>
          ))}
        </ol>

        <ul className="mt-8 flex flex-col gap-2 text-left sm:mx-auto sm:max-w-md">
          {BULLET_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-[#6B8A92]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden />
              <span>{t(`landing.v2.pricing.teaser.${key}`)}</span>
            </li>
          ))}
        </ul>

        <LocaleLink
          href="/pricing"
          className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#16A34A] transition-all hover:underline"
        >
          {t('landing.v2.pricing.teaser.allPlans')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </LocaleLink>
      </div>
      <p className="mt-4 text-xs text-[#6B8A92]">
        {t('landing.v2.pricing.teaser.kaspiNote')}
      </p>
    </div>
  );
}
