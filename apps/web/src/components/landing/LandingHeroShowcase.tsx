'use client';

import Image from 'next/image';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useState } from 'react';
import { motion } from 'motion/react';

import { useI18n } from '@/i18n';
import {
  LANDING_DEMO_HREF,
  LANDING_HERO_IPHONE_MOCKUP,
  LANDING_HERO_IPHONE_MOCKUP_PNG,
  LANDING_HERO_IPHONE_SCREEN_INSET,
  LANDING_TOY_PHOTOS,
} from '@/lib/landing/assets';

type LandingHeroShowcaseProps = {
  prefersReducedMotion: boolean;
};

/** Clean iPhone frame — invitation preview in the screen hole. No floating chips. */
export function LandingHeroShowcase({ prefersReducedMotion }: LandingHeroShowcaseProps) {
  const { t } = useI18n();
  const [mockupSrc, setMockupSrc] = useState(LANDING_HERO_IPHONE_MOCKUP);
  const screen = LANDING_HERO_IPHONE_SCREEN_INSET;

  return (
    <div className="relative flex w-full items-center justify-center">
      <motion.div
        initial={false}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto w-full max-w-[13.5rem] sm:max-w-[15.5rem] md:max-w-[17.5rem] lg:max-w-[19.5rem]"
        data-testid="hero-product-frame"
      >
        <LocaleLink
          href={LANDING_DEMO_HREF}
          className="group relative block w-full"
          aria-label={t('landing.v2.hero.ctaSecondary')}
        >
          <div
            className="relative w-full transition-transform duration-500 ease-out group-hover:-translate-y-1.5"
            style={{ aspectRatio: '1570 / 2932' }}
          >
            <div
              className="absolute overflow-hidden bg-[#1a1214]"
              style={{
                top: screen.top,
                right: screen.right,
                bottom: screen.bottom,
                left: screen.left,
                borderRadius: screen.radius,
              }}
            >
              <Image
                src={LANDING_TOY_PHOTOS.astanaWedding}
                alt=""
                fill
                priority
                className="object-cover object-[center_22%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 240px, 340px"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-3.5 pb-6 pt-12 text-center text-white sm:px-4 sm:pb-7">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/75 sm:text-[10px]">
                  {t('landing.v2.card.invite')}
                </p>
                <p className="mt-2 font-display text-[1.15rem] leading-tight tracking-wide sm:mt-2.5 sm:text-[1.35rem]">
                  Айгерим &amp; Данияр
                </p>
                <p className="mt-2 text-[9px] leading-snug text-white/80 sm:text-[10px]">
                  {t('landing.v2.card.date')}
                </p>
                <p className="mt-0.5 text-[9px] leading-snug text-white/65 sm:text-[10px]">
                  {t('landing.v2.card.venue')}
                </p>
                <span className="mt-3.5 inline-flex rounded-full bg-white px-3.5 py-1.5 text-[9px] font-semibold text-us-accent shadow-sm sm:mt-4 sm:px-4 sm:text-[10px]">
                  {t('landing.v2.card.rsvp')}
                </span>
              </div>
            </div>

            <Image
              src={mockupSrc}
              alt={t('landing.v2.hero.demoTitle')}
              fill
              priority
              className="pointer-events-none z-10 object-contain drop-shadow-[0_32px_64px_-20px_rgba(0,0,0,0.65)]"
              sizes="(max-width: 768px) 250px, 360px"
              onError={() => {
                if (mockupSrc !== LANDING_HERO_IPHONE_MOCKUP_PNG) {
                  setMockupSrc(LANDING_HERO_IPHONE_MOCKUP_PNG);
                }
              }}
            />
          </div>
        </LocaleLink>
      </motion.div>
    </div>
  );
}
