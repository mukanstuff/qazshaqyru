'use client';

import Image from 'next/image';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { motion } from 'motion/react';

import { useI18n } from '@/i18n';
import {
  LANDING_DEMO_HREF,
  LANDING_HERO_IPHONE_MOCKUP,
  LANDING_HERO_IPHONE_SCREEN_INSET,
} from '@/lib/landing/assets';

type LandingHeroShowcaseProps = {
  prefersReducedMotion: boolean;
};

/** Empty iPhone mockup frame — screen left blank for future invitation photo. */
export function LandingHeroShowcase({ prefersReducedMotion }: LandingHeroShowcaseProps) {
  const { t } = useI18n();
  const screen = LANDING_HERO_IPHONE_SCREEN_INSET;

  return (
    <div className="relative flex w-full items-center justify-center">
      <motion.div
        initial={false}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-[28rem] sm:max-w-[32rem] md:max-w-[36rem] lg:max-w-[40rem] xl:max-w-[44rem]"
        data-testid="hero-product-frame"
      >
        <LocaleLink
          href={LANDING_DEMO_HREF}
          className="group relative block w-full"
          aria-label={t('landing.v2.hero.ctaSecondary')}
        >
          <div
            className="relative w-full transition-transform duration-500 ease-out group-hover:-translate-y-1"
            style={{ aspectRatio: '1857 / 3096' }}
          >
            {/* Soft drop-shadow plate behind the phone, makes the giant frame feel grounded */}
            <div
              className="absolute inset-0 -z-10 translate-y-6 blur-3xl"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(22,163,74,0.28), rgba(22,163,74,0) 70%)',
              }}
              aria-hidden
            />

            {/* Empty screen hole — leaves space for the future invitation photo to be dropped in */}
            <div
              className="absolute"
              style={{
                top: screen.top,
                right: screen.right,
                bottom: screen.bottom,
                left: screen.left,
                borderRadius: screen.radius,
                backgroundColor: 'transparent',
              }}
              aria-hidden
            />

            {/* iPhone frame (empty mockup) */}
            <Image
              src={LANDING_HERO_IPHONE_MOCKUP}
              alt={t('landing.v2.hero.demoTitle')}
              fill
              priority
              className="pointer-events-none z-10 object-contain"
              sizes="(max-width: 768px) 420px, 640px"
            />
          </div>
        </LocaleLink>
      </motion.div>
    </div>
  );
}
