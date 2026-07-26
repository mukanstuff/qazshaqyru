'use client';

import {
  Clock3,
  MapPin,
  MessageCircle,
  UserCheck,
  Users,
  Heart,
  type LucideIcon,
} from 'lucide-react';

import { useI18n } from '@/i18n';

const STEP_KEYS = ['step1', 'step2', 'step3'] as const;

const FEATURES: Array<{ key: string; Icon: LucideIcon }> = [
  { key: 'rsvp', Icon: UserCheck },
  { key: 'map', Icon: MapPin },
  { key: 'whatsapp', Icon: MessageCircle },
  { key: 'wishes', Icon: Heart },
  { key: 'guests', Icon: Users },
  { key: 'timer', Icon: Clock3 },
];

/** Simple “how it works” + capability cards — human language, no ops jargon. */
export function LandingOpsChapter() {
  const { t } = useI18n();

  return (
    <>
      <section id="how" className="relative overflow-hidden bg-white py-20 md:py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="us-overline mb-5">{t('landing.v2.how.overline')}</p>
            <h2 className="font-display text-3xl text-us-ink md:text-5xl">
              {t('landing.v2.how.title')}{' '}
              <span className="text-us-accent">{t('landing.v2.how.titleAccent')}</span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            {STEP_KEYS.map((step, index) => (
              <article key={step} className="text-center md:text-left">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-us-accent/8 font-display text-lg text-us-accent">
                  {index + 1}
                </span>
                <h3 className="mb-2 font-display text-xl text-us-ink md:text-2xl">
                  {t(`landing.v2.how.${step}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-us-ink-muted md:text-base">
                  {t(`landing.v2.how.${step}Desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#faf8f5] py-20 md:py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="us-overline mb-5">{t('landing.v2.features.overline')}</p>
            <h2 className="font-display text-3xl text-us-ink md:text-5xl">
              {t('landing.v2.features.title')}{' '}
              <span className="text-us-accent">{t('landing.v2.features.titleAccent')}</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, Icon }) => (
              <article
                key={key}
                className="rounded-[1.5rem] border border-black/[0.06] bg-white p-6 shadow-[0_8px_28px_-20px_rgba(44,24,16,0.2)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-us-accent/8 text-us-accent">
                  <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                </div>
                <h3 className="mb-2 font-display text-xl text-us-ink">
                  {t(`landing.v2.features.${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-us-ink-muted">
                  {t(`landing.v2.features.${key}Desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
