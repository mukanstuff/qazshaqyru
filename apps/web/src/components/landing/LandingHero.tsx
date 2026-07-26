'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

import { LandingImage } from './LandingImage';

export function LandingHero() {
  const { t } = useI18n();

  return (
    <section className="landing-section overflow-hidden pt-8 sm:pt-12">
      <div className="us-container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-up max-w-xl">
            <p className="us-overline mb-4 text-[var(--us-sage)]">
              {t('landing.hero.overline')}
            </p>
            <h1 className="us-display-xl mb-6 text-balance text-[var(--us-forest)]">
              {t('landing.hero.title')}
            </h1>
            <p className="mb-8 font-body text-lg leading-relaxed text-[var(--us-forest)]/75">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[var(--us-forest)] text-white hover:bg-[var(--us-forest-hover)] focus-visible:ring-[var(--us-forest)]"
              >
                <LocaleLink href="/invitations/edit">{t('landing.hero.ctaPrimary')}</LocaleLink>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--us-sage)]/40 text-[var(--us-forest)] hover:bg-[var(--us-sage)]/10"
              >
                <LocaleLink href="/templates">{t('landing.hero.ctaSecondary')}</LocaleLink>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              data-testid="hero-product-frame"
              className="relative z-10 overflow-hidden rounded-[2rem] shadow-lg"
            >
              <LandingImage
                name="hero-main"
                alt={t('landing.hero.imageMainAlt')}
                width={800}
                height={1200}
                className="h-auto w-full object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 z-20 hidden w-40 overflow-hidden rounded-full border-4 border-[var(--us-cream)] shadow-md sm:block lg:-left-10 lg:w-48">
              <LandingImage
                name="hero-accent"
                alt={t('landing.hero.imageAccentAlt')}
                width={600}
                height={800}
                className="h-auto w-full object-cover"
                sizes="192px"
              />
            </div>
            <LandingImage
              name="floral-right"
              alt=""
              width={200}
              height={600}
              aria-hidden
              className="pointer-events-none absolute -right-4 top-1/4 hidden w-16 opacity-60 lg:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
