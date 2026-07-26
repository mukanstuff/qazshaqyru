'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useI18n } from '@/i18n';
import { LANDING_HERO_POSTER } from '@/lib/landing/assets';

type LangTab = 'ru' | 'kz';

export function LandingLanguageShowcase() {
  const { t } = useI18n();
  const [lang, setLang] = useState<LangTab>('ru');

  const copy = {
    ru: {
      names: 'Асет & Айым',
      invite: 'Приглашаем вас на нашу свадьбу',
      date: '15 июня 2025 · 18:00',
      venue: 'Ресторан «Жарық», Алматы',
      cta: 'Подтвердить присутствие',
    },
    kz: {
      names: 'Асет & Айым',
      invite: 'Сізді үйлену тойымызға шақырамыз',
      date: '2025 жылдың 15 маусымы · 18:00',
      venue: '«Жарық» мейрамханасы, Алматы',
      cta: 'Қатысуды растау',
    },
  } as const;

  const active = copy[lang];

  return (
    <section className="border-y border-us-accent/8 bg-us-cream py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="us-overline mb-5">{t('landing.v2.languages.overline')}</p>
          <h2 className="mb-5 font-display text-4xl text-us-ink md:text-5xl">
            {t('landing.v2.languages.title')}{' '}
            <span className="text-us-accent">{t('landing.v2.languages.titleAccent')}</span>
          </h2>
          <p className="mb-8 max-w-md text-base leading-relaxed text-us-ink-muted">
            {t('landing.v2.languages.subtitle')}
          </p>

          <div className="inline-flex rounded-full border border-us-accent/15 bg-white p-1">
            {(['ru', 'kz'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLang(tab)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  lang === tab
                    ? 'bg-us-accent text-us-cream'
                    : 'text-us-ink-muted hover:text-us-accent'
                }`}
              >
                {tab === 'ru' ? 'Русский' : 'Қазақша'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xs">
          <div className="us-device-frame shadow-xl">
            <div className="us-device-frame__screen relative aspect-[9/16] overflow-hidden bg-us-cream">
              <Image
                src={LANDING_HERO_POSTER}
                alt=""
                fill
                className="object-cover object-top opacity-40"
                sizes="320px"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-us-cream/30 via-transparent to-us-cream/90" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={lang}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="absolute inset-x-0 bottom-0 p-6 text-center"
                >
                  <p className="us-overline mb-2 text-us-accent">{active.invite}</p>
                  <h3 className="font-display text-3xl text-us-ink">{active.names}</h3>
                  <p className="mt-3 text-sm text-us-ink-muted">{active.date}</p>
                  <p className="mt-1 text-sm text-us-ink-muted">{active.venue}</p>
                  <div className="mt-5 inline-flex rounded-full bg-us-accent px-5 py-2 text-xs font-semibold text-us-cream">
                    {active.cta}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
