'use client';

import Image from 'next/image';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, X } from 'lucide-react';

import { useI18n } from '@/i18n';
import { CELEBRATION_IMAGES, type CelebrationKey } from '@/lib/landing/assets';
import type { CategoryRouteSlug } from '@/lib/templates/template-categories';
import type { CategoryCounts } from '@/lib/landing/category-counts';

/** Which coming-soon template each celebration signs a waitlist up for. */
const WAITLIST_SLUGS: Partial<Record<CelebrationKey, string>> = {
  toy: 'toy-classic',
  betashar: 'betashar-gold',
  kudalyk: 'toy-classic', // no dedicated kudalyk template yet — same bucket as its catalog category
  uzatu: 'uzatu-elegant',
  anniversary: 'anniversary-warm',
  shildehana: 'shildehana-soft',
};

function normalizeKzPhone(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('8') && cleaned.length === 11) cleaned = '+7' + cleaned.slice(1);
  else if (/^7\d{10}$/.test(cleaned)) cleaned = '+' + cleaned;
  return cleaned;
}

function isValidKzPhone(raw: string): boolean {
  return /^\+7\d{10}$/.test(normalizeKzPhone(raw));
}

const CELEBRATION_KEYS: CelebrationKey[] = [
  'wedding',
  'toy',
  'betashar',
  'kudalyk',
  'uzatu',
  'anniversary',
  'shildehana',
];

/**
 * Which catalogue route each celebration card points at.
 *
 * `null` means the celebration has no category route of its own yet, so it can
 * only ever be a waitlist card.
 */
const CELEBRATION_ROUTES: Record<CelebrationKey, CategoryRouteSlug | null> = {
  wedding: 'wedding',
  toy: 'toy',
  betashar: 'betashar',
  // Құдалық is hosted inside the той category rather than having its own.
  kudalyk: 'toy',
  uzatu: 'kyz-uzatu',
  anniversary: 'anniversary',
  shildehana: null,
};

/**
 * Real category pages, not query strings.
 *
 * These used to be `/templates?category=kyz_uzatu` — a filter the catalogue
 * renders no visible chip for, so the visitor landed on what looked like the
 * unfiltered catalogue. `/templates/kyz-uzatu` is an actual page with its own
 * copy, FAQ and metadata.
 */
function celebrationHref(key: CelebrationKey): string {
  const route = CELEBRATION_ROUTES[key];
  return route ? `/templates/${route}` : '/templates';
}

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
  /**
   * Live template count per catalogue route, straight from the database.
   *
   * Replaces a hardcoded `LIVE_CELEBRATIONS` set: whether a celebration is
   * ready is a fact about the catalogue, and hardcoding it guaranteed the
   * landing would keep saying "coming soon" for a category that had already
   * shipped. Absent or zero means the card offers the waitlist instead.
   */
  categoryCounts?: CategoryCounts;
};

export function LandingCelebrations({ embedded = false, categoryCounts = {} }: Props) {
  const { t } = useI18n();
  const [waitlistKey, setWaitlistKey] = useState<CelebrationKey | null>(null);

  const countFor = (key: CelebrationKey): number => {
    const route = CELEBRATION_ROUTES[key];
    return route ? (categoryCounts[route] ?? 0) : 0;
  };
  const isLive = (key: CelebrationKey) => countFor(key) > 0;

  const ctaLabel = (key: CelebrationKey) =>
    isLive(key)
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
            href={celebrationHref('wedding')}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#1F3A2E] transition-all hover:-translate-y-0.5 hover:bg-[#FAFBFC]"
          >
            {ctaLabel('wedding')}
            <ArrowUpRight className="h-4 w-4" />
          </LocaleLink>
          {/* The catalogue size, stated only when it is real — the strongest
              single fact a category card can carry. */}
          {countFor('wedding') > 0 ? (
            <p className="mt-3 font-body text-xs text-white/70">
              {t('landing.v2.celebrations.templateCount', { count: String(countFor('wedding')) })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const teaserRow = (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {CELEBRATION_KEYS.filter((k) => k !== 'wedding').map((key, idx) => {
        const colors = CARD_COLORS[(idx + 1) % CARD_COLORS.length];
        const count = countFor(key);
        const live = count > 0;

        const inner = (
          <>
            <span className="font-display text-base font-medium text-[#1F3A2E]">
              {t(`landing.v2.celebrations.${key}`)}
            </span>
            <span
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5"
              style={{ color: colors.bg }}
            >
              {/* A count is the most useful thing a category card can say, and
                  it is only ever shown when it is real. */}
              {live ? t('landing.v2.celebrations.templateCount', { count: String(count) }) : ctaLabel(key)}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </>
        );

        const cardClass =
          'group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg';
        const cardStyle = { backgroundColor: `${colors.bg}08`, borderColor: colors.border };

        // A ready category is a link to its page; an empty one opens the
        // waitlist. Same card, two different promises.
        return live ? (
          <LocaleLink key={key} href={celebrationHref(key)} className={cardClass} style={cardStyle}>
            {inner}
          </LocaleLink>
        ) : (
          <button
            key={key}
            type="button"
            onClick={() => setWaitlistKey(key)}
            className={cardClass}
            style={cardStyle}
          >
            {inner}
          </button>
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

  const modal = waitlistKey ? (
    <WaitlistModal celebrationKey={waitlistKey} onClose={() => setWaitlistKey(null)} />
  ) : null;

  if (embedded) {
    return (
      <div data-testid="landing-celebrations">
        {body}
        {modal}
      </div>
    );
  }

  return (
    <section className="border-b border-[#1F3A2E]/5 bg-gradient-to-b from-white to-[#FAFBFC] pb-12 pt-16" data-testid="landing-celebrations">
      <div className="mx-auto max-w-7xl px-6">{body}</div>
      {modal}
    </section>
  );
}

function WaitlistModal({
  celebrationKey,
  onClose,
}: {
  celebrationKey: CelebrationKey;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const slug = WAITLIST_SLUGS[celebrationKey];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug || !isValidKzPhone(phone) || status === 'busy') {
      if (!isValidKzPhone(phone)) {
        setStatus('err');
        setErrorMessage(t('landing.v2.celebrations.waitlistInvalidPhone'));
      }
      return;
    }
    setStatus('busy');
    setErrorMessage('');
    try {
      const res = await fetch('/api/templates/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, phone: normalizeKzPhone(phone) }),
      });
      if (!res.ok) throw new Error();
      setStatus('ok');
    } catch {
      setStatus('err');
      setErrorMessage(t('landing.v2.celebrations.waitlistError'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1F3A2E]/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#1F3A2E]/50 transition-colors hover:bg-[#1F3A2E]/5 hover:text-[#1F3A2E]"
        >
          <X className="h-4 w-4" />
        </button>

        {status === 'ok' ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
              <Check className="h-6 w-6" />
            </span>
            <p className="font-display text-lg font-medium text-[#1F3A2E]">
              {t('landing.v2.celebrations.waitlistSuccess')}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <h3 className="font-display text-lg font-medium text-[#1F3A2E]">
              {t('landing.v2.celebrations.waitlistTitle')} — {t(`landing.v2.celebrations.${celebrationKey}`)}
            </h3>
            <p className="mt-1.5 text-sm text-[#6B8A92]">{t('landing.v2.celebrations.waitlistSubtitle')}</p>

            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (status === 'err') setStatus('idle');
              }}
              placeholder={t('landing.v2.celebrations.waitlistPhonePlaceholder')}
              autoFocus
              className="mt-4 w-full rounded-xl border border-[#1F3A2E]/15 px-4 py-3 text-sm text-[#1F3A2E] outline-none transition-colors focus:border-[#16A34A]"
            />

            {status === 'err' ? (
              <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'busy'}
              className="mt-4 w-full rounded-full bg-[#16A34A] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#15803D] disabled:opacity-60"
            >
              {status === 'busy' ? t('common.saving') : t('landing.v2.celebrations.waitlistSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
