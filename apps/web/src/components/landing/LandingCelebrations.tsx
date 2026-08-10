'use client';

import Image from 'next/image';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

import { useI18n } from '@/i18n';
import { CELEBRATION_IMAGES, type CelebrationKey } from '@/lib/landing/assets';
import { cn } from '@/lib/shared/utils';

const CELEBRATION_KEYS: CelebrationKey[] = [
  'wedding',
  'toy',
  'betashar',
  'kudalyk',
  'uzatu',
  'anniversary',
  'shildehana',
];

const LIVE_CELEBRATIONS = new Set<CelebrationKey>(['wedding']);

const CELEBRATION_HREFS: Record<CelebrationKey, string> = {
  wedding: '/templates?category=wedding',
  toy: '/templates?category=toy',
  betashar: '/templates?category=betashar',
  kudalyk: '/templates?category=toy',
  uzatu: '/templates?category=kyz_uzatu',
  anniversary: '/templates?category=anniversary',
  shildehana: '/templates?category=other',
};

// Алатау palette for celebration cards
const CARD_COLORS = [
  { bg: '#16A34A', border: 'rgba(42, 157, 143, 0.3)', accent: '#F59E0B' },
  { bg: '#F59E0B', border: 'rgba(244, 162, 97, 0.3)', accent: '#16A34A' },
  { bg: '#F97316', border: 'rgba(231, 111, 81, 0.3)', accent: '#BAE6FD' },
  { bg: '#9D8EC4', border: 'rgba(157, 142, 196, 0.3)', accent: '#F59E0B' },
  { bg: '#BAE6FD', border: 'rgba(168, 218, 220, 0.4)', accent: '#1F3A2E' },
  { bg: '#1F3A2E', border: 'rgba(31, 58, 46, 0.3)', accent: '#F59E0B' },
];

type Props = {
  /** When true, strip outer white section chrome (used inside dark atmospheres act). */
  embedded?: boolean;
};

export function LandingCelebrations({ embedded = false }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<CelebrationKey>('wedding');

  const ctaLabel = (key: CelebrationKey) =>
    LIVE_CELEBRATIONS.has(key)
      ? t('landing.v2.celebrations.startWedding')
      : t('landing.v2.celebrations.comingSoonCta');

  const liveCard = (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#1F3A2E]/10 bg-gradient-to-br from-[#1F3A2E] to-[#0EA5E9]">
      <Image
        src={CELEBRATION_IMAGES.wedding}
        alt=""
        fill
        priority
        className="object-cover opacity-40"
        sizes="(min-width: 768px) 720px, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F3A2E]/90 via-[#1F3A2E]/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#16A34A] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            {t('landing.v2.celebrations.liveBadge')}
          </span>
        </div>
        <div>
          <h3 className="font-display text-3xl font-bold text-white md:text-4xl">
            {t('landing.v2.celebrations.wedding')}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
            {t('landing.v2.celebrations.weddingDesc')}
          </p>
          <LocaleLink
            href={CELEBRATION_HREFS.wedding}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#1F3A2E] transition-all hover:-translate-y-0.5 hover:bg-[#FAFBFC]"
          >
            {ctaLabel('wedding')}
            <ArrowUpRight className="h-4 w-4" />
          </LocaleLink>
        </div>
      </div>
    </div>
  );

  const teaserRow = (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {CELEBRATION_KEYS.filter((k) => !LIVE_CELEBRATIONS.has(k)).map((key, idx) => {
        const colors = CARD_COLORS[(idx + 1) % CARD_COLORS.length];
        return (
          <div
            key={key}
            role="link"
            aria-disabled
            tabIndex={0}
            className="group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ 
              backgroundColor: `${colors.bg}08`,
              borderColor: colors.border,
            }}
          >
            <span className="font-display text-base font-medium text-[#1F3A2E]">
              {t(`landing.v2.celebrations.${key}`)}
            </span>
            <span 
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5"
              style={{ color: colors.bg }}
            >
              {ctaLabel(key)}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        );
      })}
    </div>
  );

  const body = (
    <>
      {!embedded ? (
        <p className="us-overline mb-5 text-center">{t('landing.v2.celebrations.overline')}</p>
      ) : null}

      <div className="mx-auto max-w-4xl">
        {liveCard}
        {teaserRow}
      </div>
    </>
  );

  if (embedded) {
    return <div data-testid="landing-celebrations">{body}</div>;
  }

  return (
    <section className="border-b border-[#1F3A2E]/5 bg-gradient-to-b from-white to-[#FAFBFC] pb-12 pt-16" data-testid="landing-celebrations">
      <div className="mx-auto max-w-7xl px-6">{body}</div>
    </section>
  );
}
