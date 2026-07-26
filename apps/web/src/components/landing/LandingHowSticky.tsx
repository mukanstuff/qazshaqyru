'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Gift, Share2 } from 'lucide-react';

import { useI18n } from '@/i18n';
import { Kundelik } from '@/components/shared/ornaments';
import { LANDING_HERO_POSTER, LANDING_HERO_SCREEN, LANDING_TOY_PHOTOS } from '@/lib/landing/assets';

const STEPS = [
  { key: 'step1', num: '01', Icon: Camera, screen: LANDING_HERO_SCREEN },
  { key: 'step2', num: '02', Icon: Gift, screen: LANDING_HERO_POSTER },
  { key: 'step3', num: '03', Icon: Share2, screen: LANDING_TOY_PHOTOS.dombraCeremony },
] as const;

export function LandingHowSticky() {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = stepRefs.current.map((el, index) => {
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveStep(index);
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
      );
      observer.observe(el);
      return observer;
    });

    return () => {
      observers.forEach((observer, index) => {
        observer?.disconnect();
        void index;
      });
    };
  }, []);

  const currentScreen = STEPS[activeStep]?.screen ?? LANDING_HERO_SCREEN;

  return (
    <section id="how" className="bg-us-cream py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center md:text-left">
          <div className="mb-5 flex items-center justify-center gap-3 md:justify-start">
            <Kundelik size={28} color="var(--us-accent)" strokeWidth={0.9} className="opacity-70" />
            <p className="us-overline">{t('landing.v2.how.overline')}</p>
          </div>
          <h2 className="font-display text-4xl text-us-ink md:text-5xl">
            {t('landing.v2.how.title')}{' '}
            <span className="text-us-accent">{t('landing.v2.how.titleAccent')}</span>
          </h2>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8 lg:space-y-16">
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                className={`rounded-2xl border p-6 transition-all duration-300 md:p-8 ${
                  activeStep === index
                    ? 'border-us-accent/25 bg-white shadow-md'
                    : 'border-us-accent/8 bg-white/60'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      activeStep === index ? 'bg-us-accent text-white' : 'bg-us-accent/8 text-us-accent'
                    }`}
                  >
                    <step.Icon className="h-5 w-5" />
                  </div>
                  <span className="select-none font-display text-4xl leading-none text-us-accent/12">
                    {step.num}
                  </span>
                </div>
                <h3 className="mb-3 font-display text-2xl text-us-ink">
                  {t(`landing.v2.how.${step.key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-us-ink-muted">
                  {t(`landing.v2.how.${step.key}Desc`)}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden lg:sticky lg:top-28 lg:block">
            <div className="mx-auto w-72">
              <div className="us-device-frame shadow-xl">
                <div className="us-device-frame__screen relative aspect-[9/16] overflow-hidden bg-us-cream">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentScreen}
                      initial={false}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={currentScreen}
                        alt=""
                        fill
                        className="object-cover object-top"
                        sizes="288px"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
