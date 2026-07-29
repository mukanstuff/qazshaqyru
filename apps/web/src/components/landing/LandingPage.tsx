'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { SoftLocaleBanner } from '@/components/seo/SoftLocaleBanner';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';
import { SiteMarketingHeader } from '@/components/shared/SiteMarketingHeader';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, Check, Phone } from 'lucide-react';

import { useI18n } from '@/i18n';

import { LandingFaq } from './LandingFaq';
import { LandingHeroShowcase } from './LandingHeroShowcase';
import { LandingCelebrations } from './LandingCelebrations';
import { LandingGrain } from './LandingGrain';
import { PricingTeaser } from './PricingTeaser';
import { LandingOpsChapter } from './LandingOpsChapter';
import { LANDING_HERO_BG } from '@/lib/landing/assets';
import { getPublicWhatsappNumber, getSupportMailto, getWhatsappHref } from '@/lib/site/legal-config';

type LandingPageProps = {
  /** Kept for callers; hero no longer shows vanity stats (D6 hero budget). */
  publishedInvitations?: number;
  isLoggedIn?: boolean;
  /** Minimum template price from DB for pricing teaser. */
  minTemplatePriceKzt?: number;
};

export function LandingPage({
  publishedInvitations: _publishedInvitations = 0,
  isLoggedIn = false,
  minTemplatePriceKzt = 3_990,
}: LandingPageProps) {
  void _publishedInvitations;
  const { t } = useI18n();
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const hasWhatsapp = Boolean(getPublicWhatsappNumber());
  const contactHref = hasWhatsapp ? getWhatsappHref() : getSupportMailto();

  return (
    <div className="landing-page relative min-h-screen bg-white font-body text-us-ink">
      <LandingGrain />
      <SoftLocaleBanner />
      <SiteMarketingHeader isLoggedIn={isLoggedIn} />

      <div className="overflow-x-clip">
        <section
          data-landing-hero
          className="relative flex min-h-[100dvh] flex-col overflow-hidden pb-20 md:h-[100dvh] md:max-h-[100dvh] md:pb-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[#fcfcfb]">
            <Image
              src={LANDING_HERO_BG}
              alt=""
              fill
              priority
              quality={95}
              className="landing-hero-ornament-img object-cover object-right scale-[1.02]"
              sizes="100vw"
            />
            {/* Mobile: cream under copy on top; ornament visible below */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#fcfcfb_0%,#fcfcfb_40%,rgba(252,252,251,0.9)_52%,rgba(252,252,251,0.35)_68%,transparent_88%)] md:hidden" />
            {/* Desktop: cream left → ornament right under phone */}
            <div className="landing-hero-fade-x absolute inset-0 hidden md:block" />
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl flex-1 content-start items-start gap-6 px-5 pb-8 pt-[5.25rem] sm:gap-8 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:content-center md:items-center md:gap-8 md:px-8 md:pb-12 md:pt-[5.75rem] lg:gap-12 lg:px-12">
            <div className="order-1 flex min-h-0 flex-col justify-center">
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="landing-hero-readable max-w-2xl"
              >
                <p
                  className="landing-hero-brand font-display tracking-wide text-us-ink"
                  data-testid="landing-hero-brand"
                >
                  {t('landing.v2.hero.badge')}
                </p>

                <h1
                  className="mt-3 text-balance text-us-ink md:mt-5"
                  data-testid="landing-hero-title"
                >
                  {t('landing.v2.hero.titleLine1')}{' '}
                  <em className="landing-hero-accent not-italic text-us-accent">
                    {t('landing.v2.hero.titleLine2')}
                  </em>{' '}
                  {t('landing.v2.hero.titleLine3')}
                </h1>

                <p
                  className="landing-hero-sub mt-4 max-w-lg md:mt-5 md:max-w-xl"
                  data-testid="landing-hero-subtitle"
                >
                  {t('landing.v2.hero.subtitle')}
                </p>

                <div
                  className="mt-6 flex flex-wrap gap-3 md:mt-7"
                  data-testid="landing-hero-ctas"
                >
                  <LocaleLink
                    href="/create"
                    className="flex min-h-11 items-center gap-2 rounded-full bg-us-accent px-6 py-3 text-sm font-medium text-us-cream shadow-[0_14px_32px_-16px_rgba(44,24,16,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-us-accent-strong md:min-h-12 md:px-8 md:text-base"
                  >
                    {t('landing.v2.hero.ctaPrimary')} <ArrowRight className="h-4 w-4" />
                  </LocaleLink>
                  <LocaleLink
                    href="/templates"
                    className="flex min-h-11 max-w-full items-center rounded-full border border-us-accent/25 bg-white/70 px-5 py-3 text-sm font-medium leading-snug text-us-ink backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-us-accent/45 hover:bg-white sm:px-7 md:min-h-12 md:text-base"
                    aria-label={t('landing.v2.hero.ctaSecondary')}
                  >
                    {t('landing.v2.hero.ctaSecondary')}
                  </LocaleLink>
                </div>

                <p className="mt-4 text-sm text-us-ink-muted">
                  <LocaleLink href="/pricing" className="underline-offset-2 hover:text-us-accent hover:underline">
                    {t('landing.v2.hero.priceFrom')}
                  </LocaleLink>
                </p>

                <ul
                  className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2"
                  data-testid="landing-hero-trust"
                >
                  {(['trust1', 'trust2', 'trust3'] as const).map((key) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-sm text-us-ink-muted"
                    >
                      <Check className="h-4 w-4 shrink-0 text-us-accent" aria-hidden />
                      <span>{t(`landing.v2.hero.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <div className="order-2 flex min-h-0 items-center justify-center overflow-visible pb-4 md:pb-2">
              <LandingHeroShowcase prefersReducedMotion={prefersReducedMotion} />
            </div>
          </div>
        </section>

        <LandingOpsChapter />

        <section id="templates" data-nav-theme="dark" className="relative overflow-hidden border-t border-us-accent/8 bg-us-accent py-24">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="us-overline mb-5 text-us-gold">{t('landing.v2.celebrations.overline')}</p>
              <h2 className="mb-3 font-display text-4xl text-us-cream md:text-5xl">
                {t('landing.v2.templates.title')}
              </h2>
              <p className="text-sm text-white/75">{t('landing.v2.templates.subtitle')}</p>
            </div>

            <LandingCelebrations embedded />
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-white py-20 md:py-24">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <p className="us-overline mb-5">{t('landing.v2.pricing.overline')}</p>
              <h2 className="font-display text-4xl text-us-ink md:text-5xl">
                {t('landing.v2.pricing.title')}{' '}
                <span className="text-us-accent">{t('landing.v2.pricing.titleAccent')}</span>
              </h2>
            </div>

            <PricingTeaser minTemplatePriceKzt={minTemplatePriceKzt} />
          </div>
        </section>

        <LandingFaq />

        <section data-nav-theme="dark" className="relative overflow-hidden bg-us-accent py-28">
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <h2 className="mb-6 font-display text-5xl leading-[1.08] text-us-cream md:text-[3.8rem]">
              {t('landing.v2.cta.titleLine1')}
              <br />
              {t('landing.v2.cta.titleLine2')}
            </h2>
            <p className="mx-auto mb-10 max-w-sm text-lg leading-relaxed text-white/85">
              {t('landing.v2.cta.subtitle')}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <LocaleLink
                href="/create"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-9 py-4 text-base font-semibold text-us-accent transition-colors hover:bg-white/90"
              >
                {t('landing.v2.cta.primary')} <ArrowRight className="h-5 w-5" />
              </LocaleLink>
              <a
                href={contactHref}
                target={hasWhatsapp ? '_blank' : undefined}
                rel={hasWhatsapp ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/30 px-9 py-4 text-base font-medium text-us-cream transition-all hover:border-white/55 hover:bg-white/8"
              >
                <Phone className="h-4 w-4 text-us-gold" />
                {hasWhatsapp ? t('landing.v2.cta.whatsapp') : t('site.contacts.email')}
              </a>
            </div>
            <p className="mt-6 text-sm text-white/70">{t('landing.v2.cta.disclaimer')}</p>
          </div>
        </section>

        <SiteCompactFooter />
      </div>
    </div>
  );
}
