'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useI18n } from '@/i18n';

/**
 * Real customer reviews, or nothing at all.
 *
 * The section renders only once enough approved reviews exist — the threshold
 * lives on the server and arrives as `enough`. Until then it returns null and
 * the landing simply does not have a testimonials block.
 *
 * That emptiness is the point. The competitor sites carry review walls, and the
 * cheap way to match them is to write the testimonials yourself or generate
 * screenshots of them. This project has already been cleaned of exactly that
 * once, and a small market where invitations get forwarded between relatives is
 * the worst possible place to be caught inventing customers. So the block waits
 * for real ones instead of faking them, and there is nothing here to switch on
 * early — no sample data, no placeholder faces, no "coming soon" stand-in.
 */

type Review = {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  createdAt: string;
};

type Payload = {
  enough: boolean;
  count: number;
  average: number | null;
  reviews: Review[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={
            n <= rating
              ? 'h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]'
              : 'h-3.5 w-3.5 text-us-border'
          }
        />
      ))}
    </span>
  );
}

export function LandingReviews() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((d: Payload) => {
        if (alive) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!data?.enough || data.reviews.length === 0) return null;

  const fmt = new Intl.DateTimeFormat(locale === 'kz' ? 'kk-KZ' : 'ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="border-t border-[#16A34A]/10 bg-white py-20" data-testid="landing-reviews">
      <div className="us-container max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl text-us-ink md:text-4xl">
            {t('landing.v2.reviews.title')}
          </h2>
          {data.average ? (
            <p className="mt-3 flex items-center justify-center gap-2 font-body text-sm text-us-ink-muted">
              <Stars rating={Math.round(data.average)} />
              <span>
                {data.average} · {t('landing.v2.reviews.count', { count: String(data.count) })}
              </span>
            </p>
          ) : null}
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.reviews.slice(0, 6).map((r) => (
            <li
              key={r.id}
              className="rounded-3xl border border-us-border/70 bg-[#fcfcfb] p-6 text-left"
            >
              <Stars rating={r.rating} />
              <p className="mt-3 font-body text-[15px] leading-relaxed text-us-ink">{r.text}</p>
              <p className="mt-4 font-body text-sm font-medium text-us-ink">{r.authorName}</p>
              <p className="font-body text-xs text-us-ink-muted">
                {fmt.format(new Date(r.createdAt))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
