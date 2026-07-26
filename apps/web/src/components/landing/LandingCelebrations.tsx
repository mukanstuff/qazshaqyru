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

  const body = (
    <>
      {!embedded ? (
        <p className="us-overline mb-5 text-center">{t('landing.v2.celebrations.overline')}</p>
      ) : null}

      <div className="hidden h-[340px] gap-2 md:flex">
        {CELEBRATION_KEYS.map((key) => {
          const isActive = active === key;
          const href = LIVE_CELEBRATIONS.has(key) ? CELEBRATION_HREFS[key] : '/contacts';
          return (
            <LocaleLink
              key={key}
              href={href}
              onMouseEnter={() => setActive(key)}
              onFocus={() => setActive(key)}
              className={cn(
                'group relative overflow-hidden rounded-[1.75rem] border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
                isActive
                  ? 'flex-[3] border-us-cream/30 shadow-lg'
                  : 'flex-[0.65] border-us-cream/15 hover:flex-[1.2]',
              )}
            >
              <Image
                src={CELEBRATION_IMAGES[key]}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes={isActive ? '480px' : '120px'}
              />
              <div
                className={cn(
                  'absolute inset-0 transition-colors duration-500',
                  isActive
                    ? 'bg-gradient-to-t from-us-ink/85 via-us-ink/30 to-us-ink/5'
                    : 'bg-gradient-to-t from-us-ink/70 via-us-ink/40 to-us-ink/15',
                )}
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="landing-headline block font-display text-xl text-us-cream md:text-2xl">
                  {t(`landing.v2.celebrations.${key}`)}
                </span>
                {isActive ? (
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">
                    {t(`landing.v2.celebrations.${key}Desc`)}
                  </p>
                ) : null}
                {isActive ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-us-gold">
                    {ctaLabel(key)}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </div>
            </LocaleLink>
          );
        })}
      </div>

      <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 scrollbar-none md:hidden">
        {CELEBRATION_KEYS.map((key) => {
          const href = LIVE_CELEBRATIONS.has(key) ? CELEBRATION_HREFS[key] : '/contacts';
          return (
            <LocaleLink
              key={key}
              href={href}
              className="group relative h-52 w-44 flex-shrink-0 overflow-hidden rounded-2xl border border-us-cream/15 bg-us-ink/20 shadow-sm"
            >
              <Image
                src={CELEBRATION_IMAGES[key]}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="176px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-us-ink/85 via-us-ink/30 to-us-ink/5" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="text-base font-medium leading-tight text-us-cream">
                  {t(`landing.v2.celebrations.${key}`)}
                </span>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/75">
                  {t(`landing.v2.celebrations.${key}Desc`)}
                </p>
                <p className="mt-2 text-[10px] font-medium text-us-gold">{ctaLabel(key)}</p>
              </div>
            </LocaleLink>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return <div data-testid="landing-celebrations">{body}</div>;
  }

  return (
    <section className="border-b border-us-accent/8 bg-white pb-12 pt-16" data-testid="landing-celebrations">
      <div className="mx-auto max-w-7xl px-6">{body}</div>
    </section>
  );
}
