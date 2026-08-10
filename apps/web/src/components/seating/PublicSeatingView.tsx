'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';

interface PublicSeatingTable {
  id: string;
  name: string;
  capacity: number;
  assignedCount: number;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  rotation?: number | null;
  shape?: string | null;
  tableColor?: string | null;
  guests: { id: string; name: string }[];
}

interface Props {
  invitationId: string;
  tables: PublicSeatingTable[];
  highlightGuestId?: string;
}

const STAGE_W = 800;
const STAGE_H = 520;

export function PublicSeatingView({ invitationId, tables, highlightGuestId }: Props) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const myTableId = useMemo(() => {
    if (!highlightGuestId) return null;
    return tables.find((tbl) => tbl.guests.some((g) => g.id === highlightGuestId))?.id ?? null;
  }, [highlightGuestId, tables]);

  const selected = tables.find((tbl) => tbl.id === selectedId) ?? null;

  const totalSeated = tables.reduce((n, tbl) => n + tbl.guests.length, 0);
  const totalCapacity = tables.reduce((n, tbl) => n + tbl.capacity, 0);

  if (tables.length === 0) {
    return (
      <div className="rounded-2xl border border-us-ink/8 bg-white p-8 text-center">
        <p className="text-base text-us-ink">{t('seating.public.emptyTitle')}</p>
        <p className="mt-2 text-sm text-us-ink-muted">{t('seating.public.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myTableId && (
        <div className="rounded-2xl border border-us-accent/30 bg-us-accent/8 p-4">
          <p className="text-sm font-semibold text-us-ink">{t('seating.public.yourTableTitle')}</p>
          <p className="mt-1 text-sm text-us-ink-muted">
            {t('seating.public.yourTableDesc', {
              tableName: tables.find((tbl) => tbl.id === myTableId)?.name ?? '—',
            })}
          </p>
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-2xl border border-us-ink/8 bg-gradient-to-br from-white to-us-ink/2"
        style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
      >
        {tables.map((tbl) => {
          const isMy = tbl.id === myTableId;
          const isSelected = tbl.id === selectedId;
          const x = tbl.x ?? 40;
          const y = tbl.y ?? 40;
          const w = tbl.w ?? 120;
          const h = tbl.h ?? 120;
          const color = tbl.tableColor ?? '#10b981';
          const shape = tbl.shape ?? 'round';

          const shapeClass = shape === 'square' ? 'rounded-2xl' : 'rounded-full';

          return (
            <button
              key={tbl.id}
              type="button"
              onClick={() => setSelectedId(tbl.id === selectedId ? null : tbl.id)}
              className={`absolute flex flex-col items-center justify-center shadow-sm transition-all ${shapeClass} ${
                isSelected ? 'ring-2 ring-us-ink' : 'ring-1 ring-us-ink/15'
              } ${isMy ? 'ring-2 ring-us-accent' : ''}`}
              style={{
                left: `${(x / STAGE_W) * 100}%`,
                top: `${(y / STAGE_H) * 100}%`,
                width: `${(w / STAGE_W) * 100}%`,
                height: `${(h / STAGE_H) * 100}%`,
                backgroundColor: color,
                transform: tbl.rotation ? `rotate(${tbl.rotation}deg)` : undefined,
              }}
              aria-label={tbl.name}
            >
              <span className="font-display text-base font-semibold text-white">{tbl.name}</span>
              <span className="text-xs font-medium text-white/85">
                {tbl.guests.length} / {tbl.capacity}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-us-ink/8 bg-white p-4">
        <p className="font-display text-base text-us-ink">
          {t('seating.public.summary', {
            seated: String(totalSeated),
            tables: String(tables.length),
            capacity: String(totalCapacity),
          })}
        </p>
      </div>

      {selected && (
        <div className="rounded-2xl border border-us-ink/8 bg-white p-4">
          <p className="mb-3 font-display text-lg font-semibold text-us-ink">{selected.name}</p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('seating.public.searchPlaceholder')}
            className="mb-3 w-full rounded-xl border border-us-ink/15 px-3 py-2 text-sm focus:border-us-accent focus:outline-none"
          />
          <ul className="grid grid-cols-2 gap-2 text-sm text-us-ink sm:grid-cols-3">
            {selected.guests
              .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()))
              .map((g) => (
                <li
                  key={g.id}
                  className={`rounded-lg px-3 py-2 ${
                    g.id === highlightGuestId
                      ? 'bg-us-accent/15 font-semibold'
                      : 'bg-us-ink/4'
                  }`}
                >
                  {g.name}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
