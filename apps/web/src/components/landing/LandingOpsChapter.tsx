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

const FEATURES: Array<{ key: string; Icon: LucideIcon; color: string }> = [
  { key: 'rsvp', Icon: UserCheck, color: '#16A34A' },
  { key: 'map', Icon: MapPin, color: '#F59E0B' },
  { key: 'whatsapp', Icon: MessageCircle, color: '#F97316' },
  { key: 'wishes', Icon: Heart, color: '#C9ADA7' },
  { key: 'guests', Icon: Users, color: '#BAE6FD' },
  { key: 'timer', Icon: Clock3, color: '#9D8EC4' },
];

/** Simple "how it works" + capability cards — human language, no ops jargon. */
export function LandingOpsChapter() {
  const { t } = useI18n();

  return (
    <>
      <section id="how" className="relative overflow-hidden bg-gradient-to-b from-white to-[#FAFBFC] py-20 md:py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="us-overline mb-5">{t('landing.v2.how.overline')}</p>
            <h2 className="font-display text-3xl text-[#1F3A2E] md:text-5xl">
              {t('landing.v2.how.title')}{' '}
              <span className="text-[#16A34A]">{t('landing.v2.how.titleAccent')}</span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            {STEP_KEYS.map((step, index) => (
              <article key={step} className="text-center md:text-left">
                <span 
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full font-display text-lg text-white"
                  style={{ backgroundColor: index === 0 ? '#16A34A' : index === 1 ? '#F59E0B' : '#F97316' }}
                >
                  {index + 1}
                </span>
                <h3 className="mb-2 font-display text-xl text-[#1F3A2E] md:text-2xl">
                  {t(`landing.v2.how.${step}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B8A92] md:text-base">
                  {t(`landing.v2.how.${step}Desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAFBFC] to-[#FFFBEB] py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/3 h-[300px] w-[300px] rounded-full bg-[#BAE6FD]/10 blur-[100px]" aria-hidden />
          <div className="absolute -right-20 bottom-1/3 h-[250px] w-[250px] rounded-full bg-[#F59E0B]/8 blur-[80px]" aria-hidden />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="us-overline mb-5">{t('landing.v2.features.overline')}</p>
            <h2 className="font-display text-3xl text-[#1F3A2E] md:text-5xl">
              {t('landing.v2.features.title')}{' '}
              <span className="text-[#F59E0B]">{t('landing.v2.features.titleAccent')}</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, Icon, color }) => (
              <article
                key={key}
                className="group relative overflow-hidden rounded-2xl border border-[#1F3A2E]/8 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div 
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                </div>
                <h3 className="mb-2 font-display text-xl text-[#1F3A2E]">
                  {t(`landing.v2.features.${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B8A92]">
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
