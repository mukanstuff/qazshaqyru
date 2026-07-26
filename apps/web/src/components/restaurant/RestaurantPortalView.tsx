'use client';

import type { RestaurantPortalPayload } from '@/lib/restaurant/portal-data';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const STATUS_RU: Record<string, string> = {
  attending: 'Придут',
  pending: 'Ждём',
  not_attending: 'Не смогут',
  mixed: 'Смешанно',
};

interface Props {
  portal: RestaurantPortalPayload;
}

export function RestaurantPortalView({ portal }: Props) {
  return (
    <main className="min-h-screen bg-[color-mix(in_srgb,var(--us-cream)_92%,var(--us-warm-accent)_8%)] px-4 py-8 text-us-ink">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2 border-b border-us-border pb-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            Для менеджера зала
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
          <Stat label="Подтверждено" value={portal.confirmedSeats} />
          <Stat label="Ожидаем" value={portal.expectedSeats} />
          <Stat label="Гостей" value={portal.guestCount} />
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">Семьи / столы</h2>
          {portal.households.length === 0 ? (
            <p className="text-sm text-us-ink-muted">Пока нет гостей.</p>
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
                      {h.seats} мест · {STATUS_RU[h.status] ?? h.status}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {h.guests.map((g) => (
                      <li key={`${h.label}-${g.name}`} className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{g.name}</span>
                        {g.tableName ? (
                          <span className="text-us-ink-muted">{g.tableName}</span>
                        ) : null}
                        {g.dietary ? (
                          <span className="text-us-accent">{g.dietary}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="pt-4 text-center text-xs text-us-ink-muted">
          Обновлено {formatDate(portal.updatedAt)} · только чтение · QazShaqyru
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
