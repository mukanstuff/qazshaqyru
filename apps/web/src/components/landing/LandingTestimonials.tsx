'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { useI18n } from '@/i18n';

const TESTIMONIAL_KEYS = ['one', 'two', 'three'] as const;
const TESTIMONIAL_CITIES = ['Алматы', 'Астана', 'Шымкент'] as const;
const BUBBLE_COLORS = ['#dcf8c6', '#ffffff', '#dcf8c6'] as const;

type LandingTestimonialsProps = {
  prefersReducedMotion: boolean;
};

export function LandingTestimonials({ prefersReducedMotion }: LandingTestimonialsProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % TESTIMONIAL_KEYS.length);
    }, 4200);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const key = TESTIMONIAL_KEYS[active];

  return (
    <section className="bg-us-cream py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="us-overline mb-5">{t('landing.v2.testimonials.overline')}</p>
          <h2 className="font-display text-4xl text-us-ink md:text-5xl">
            {t('landing.v2.testimonials.title')}{' '}
            <span className="text-us-accent">{t('landing.v2.testimonials.titleAccent')}</span>
          </h2>
        </div>

        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TESTIMONIAL_CITIES.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1.5 rounded-full border border-us-accent/12 bg-white px-4 py-2 text-xs font-medium text-us-ink"
              >
                <MapPin className="h-3.5 w-3.5 text-us-accent" aria-hidden />
                {city}
              </span>
            ))}
          </div>
          <p className="max-w-lg text-center text-sm text-us-ink-muted">
            {t('landing.v2.testimonials.citiesLabel')}
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="overflow-hidden rounded-[2rem] border border-us-accent/10 bg-[#ece5dd] shadow-xl">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                {t(`landing.v2.testimonials.${key}Name`).charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold">{t('landing.v2.testimonials.chatHeader')}</div>
                <div className="text-[11px] text-white/75">
                  {t('landing.v2.testimonials.chatOnline')}
                </div>
              </div>
            </div>

            <div className="relative min-h-[220px] p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={key}
                  initial={false}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed text-us-ink shadow-sm ${
                      active % 2 === 0 ? 'ml-auto rounded-tr-sm' : 'rounded-tl-sm'
                    }`}
                    style={{ backgroundColor: BUBBLE_COLORS[active] }}
                  >
                    {t(`landing.v2.testimonials.${key}Text`)}
                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-us-ink-muted">
                      <span>
                        {t(`landing.v2.testimonials.${key}Name`)} ·{' '}
                        {t(`landing.v2.testimonials.${key}City`)}
                      </span>
                      <span>{t(`landing.v2.testimonials.${key}Event`)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {TESTIMONIAL_KEYS.map((itemKey, i) => (
                      <button
                        key={itemKey}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={t(`landing.v2.testimonials.${itemKey}Name`)}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i === active ? 'bg-[#075e54]' : 'bg-us-ink/15'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 hidden gap-3 md:grid md:grid-cols-3">
            {TESTIMONIAL_KEYS.map((itemKey, i) => (
              <button
                key={itemKey}
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  i === active
                    ? 'border-us-accent/25 bg-white shadow-md'
                    : 'border-us-accent/8 bg-white/60 hover:border-us-accent/15'
                }`}
              >
                <div className="mb-1 text-xs font-semibold text-us-accent">
                  {t(`landing.v2.testimonials.${itemKey}Name`)}
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-us-ink-muted">
                  {t(`landing.v2.testimonials.${itemKey}Text`)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
