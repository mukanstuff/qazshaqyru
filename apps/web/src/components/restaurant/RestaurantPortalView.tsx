'use client';

import type { RestaurantPortalPayload } from '@/lib/restaurant/portal-data';
import { useI18n } from '@/i18n';

/**
 * The venue manager's read-only guest list — the page a customer forwards to
 * their тойхана. Every string on it used to be a Russian literal and the date
 * was formatted with a hardcoded 'ru-RU' locale, on a product whose entire
 * point is that it works in Kazakh too. Now it follows the site locale like
 * every other page.
 */
interface Props {
  portal: RestaurantPortalPayload;
}

export function RestaurantPortalView({ portal }: Props) {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'kz' ? 'kk-KZ' : 'ru-RU';

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusLabel = (status: string): string => {
    const key = `restaurantPortal.status.${status}`;
    const label = t(key);
    // t() returns the key itself when it is missing — never show that to a user.
    return label === key ? status : label;
  };

  return (
    <main className="min-h-screen bg-[color-mix(in_srgb,var(--us-cream)_92%,var(--us-warm-accent)_8%)] px-4 py-8 text-us-ink">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2 border-b border-us-border pb-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            {t('restaurantPortal.eyebrow')}
          </p>
          <h1 className="font-display text-3xl leading-tight md:text-4xl">{portal.title}</h1>
          <p className="font-body text-sm text-us-ink-muted">
            {formatDate(portal.eventDate)}
            {portal.eventTime ? ` · ${portal.eventTime}` : ''}
            {portal.eventPlace ? ` · ${portal.eventPlace}` : ''}
          </p>
          {portal.address ? (
            <p className="font-body text-sm text-us-ink-muted">{portal.address}</p>
          ) : null}
        </header>

        <section className="grid grid-cols-3 gap-3">
          <Stat label={t('restaurantPortal.confirmed')} value={portal.confirmedSeats} />
          <Stat label={t('restaurantPortal.expected')} value={portal.expectedSeats} />
          <Stat label={t('restaurantPortal.guests')} value={portal.guestCount} />
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">{t('restaurantPortal.householdsTitle')}</h2>
          {portal.households.length === 0 ? (
            <p className="text-sm text-us-ink-muted">{t('restaurantPortal.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {portal.households.map((h) => (
                <li
                  key={h.label}
                  className="rounded-2xl border border-us-border bg-us-ivory/80 p-4 shadow-us-sm"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{h.label}</span>
                    <span className="text-sm text-us-ink-muted">
                      {t('restaurantPortal.seats', { count: h.seats })} · {statusLabel(h.status)}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {h.guests.map((g) => (
                      <li key={`${h.label}-${g.name}`} className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{g.name}</span>
                        {g.tableName ? (
                          <span className="text-us-ink-muted">{g.tableName}</span>
                        ) : null}
                        {g.dietary ? <span className="text-us-accent">{g.dietary}</span> : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pt-4 text-center text-xs text-us-ink-muted">
          {t('restaurantPortal.updated', { date: formatDate(portal.updatedAt) })}
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-us-border bg-us-ivory p-4 text-center">
      <div className="font-display text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-us-ink-muted">{label}</div>
    </div>
  );
}
