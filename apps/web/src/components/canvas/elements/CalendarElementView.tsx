'use client';

import { useMemo } from 'react';
import type { CalendarElement } from '@/lib/canvas/types';
import { buildMonthGrid } from '@/lib/canvas/calendar-grid';
import { loadAndResolveFont } from './fontStack';

/**
 * Month grid with the event day marked.
 *
 * The grid is computed from `targetIso` on every render rather than stored in
 * the document, so it can never disagree with the event date shown elsewhere
 * in the invitation. The day arithmetic lives in lib/canvas/calendar-grid.ts
 * so it can be unit tested on its own.
 */

const MONTHS_KZ = [
  'ҚАҢТАР', 'АҚПАН', 'НАУРЫЗ', 'СӘУІР', 'МАМЫР', 'МАУСЫМ',
  'ШІЛДЕ', 'ТАМЫЗ', 'ҚЫРКҮЙЕК', 'ҚАЗАН', 'ҚАРАША', 'ЖЕЛТОҚСАН',
];

const MONTHS_RU = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ',
];

const WEEKDAYS_KZ = ['ДС', 'СС', 'СР', 'БС', 'ЖМ', 'СБ', 'ЖС'];
const WEEKDAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

interface Props {
  el: CalendarElement;
  locale?: 'kz' | 'ru';
}

export function CalendarElementView({ el, locale = 'kz' }: Props) {
  const target = useMemo(() => {
    const parsed = el.targetIso ? new Date(el.targetIso) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }, [el.targetIso]);

  const year = target ? target.getUTCFullYear() : new Date().getUTCFullYear();
  const month = target ? target.getUTCMonth() : new Date().getUTCMonth();
  const eventDay = target ? target.getUTCDate() : null;

  const cells = useMemo(
    () => buildMonthGrid(year, month, el.showAdjacentDays ?? false),
    [year, month, el.showAdjacentDays]
  );

  const months = locale === 'ru' ? MONTHS_RU : MONTHS_KZ;
  const weekdays = locale === 'ru' ? WEEKDAYS_RU : WEEKDAYS_KZ;
  const accent = el.accentColor ?? el.color;
  const font = loadAndResolveFont(el.fontFamily);
  const mark = el.markStyle ?? 'ring';

  return (
    <div
      className="canvas-calendar"
      style={{
        fontFamily: font,
        color: el.color,
        fontSize: el.fontSize,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6em',
      }}
    >
      {(el.showMonthTitle ?? true) && (
        <div
          style={{
            textAlign: 'center',
            letterSpacing: '0.18em',
            fontSize: '1.15em',
          }}
        >
          {months[month]} {year}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          rowGap: '0.35em',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {(el.showWeekdays ?? true) &&
          weekdays.map((w) => (
            <div key={w} style={{ opacity: 0.55, fontSize: '0.82em', letterSpacing: '0.06em' }}>
              {w}
            </div>
          ))}

        {cells.map((cell, i) => {
          const isEvent = !cell.adjacent && cell.day !== null && cell.day === eventDay;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1 / 1',
                opacity: cell.day === null ? 0 : cell.adjacent ? 0.25 : 1,
                position: 'relative',
                color: isEvent && mark === 'fill' ? '#fff' : undefined,
                background: isEvent && mark === 'fill' ? accent : undefined,
                border: isEvent && mark === 'ring' ? `1.5px solid ${accent}` : undefined,
                borderRadius: '50%',
                fontWeight: isEvent ? 600 : 400,
              }}
            >
              {cell.day ?? ''}
              {isEvent && mark === 'heart' && (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '-18%',
                    width: '136%',
                    height: '136%',
                    fill: 'none',
                    stroke: accent,
                    strokeWidth: 1.6,
                  }}
                >
                  <path d="M12 21s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9Z" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
