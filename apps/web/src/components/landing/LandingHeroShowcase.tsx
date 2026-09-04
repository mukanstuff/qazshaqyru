'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

import { useI18n } from '@/i18n';
import { LANDING_HERO_IPHONE_MOCKUP } from '@/lib/landing/assets';

type LandingHeroShowcaseProps = {
  prefersReducedMotion: boolean;
};

/** Empty iPhone mockup frame — screen left blank for future invitation photo. */
export function LandingHeroShowcase({ prefersReducedMotion }: LandingHeroShowcaseProps) {
  const { t } = useI18n();

  return (
    <div className="relative flex w-full items-center justify-center">
      {/* `initial={false}` here used to tell motion "skip the intro and paint
          the end state", so the phone popped in instantly at full opacity
          while the hero copy beside it faded in over 0.8s — the transition
          below was dead code that never ran. Give it a real initial state so
          it actually animates, slightly trailing the copy. */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-[28rem] sm:max-w-[32rem] md:max-w-[36rem] lg:max-w-[40rem] xl:max-w-[44rem]"
        data-testid="hero-product-frame"
      >
        {/*
          Not a link any more. It used to point at `/i/demo?layout=luxe-gold`
          — a slug that has never existed in the Template table, so the demo
          route fell through to the legacy renderer's permanently-null manifest
          lookup and served a "not found" page. Clicking the hero image took
          you to a broken page. The mockup's screen is an empty transparent
          hole anyway, so there is nothing here to click through to.
        */}
        <div className="relative w-full" style={{ aspectRatio: '1857 / 3096' }}>
          {/* Soft drop-shadow plate behind the phone, makes the giant frame feel grounded */}
          <div
            className="absolute inset-0 -z-10 translate-y-6 blur-3xl"
            style={{
              background:
                'radial-gradient(closest-side, rgba(22,163,74,0.28), rgba(22,163,74,0) 70%)',
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
      </motion.div>
    </div>
  );
}
