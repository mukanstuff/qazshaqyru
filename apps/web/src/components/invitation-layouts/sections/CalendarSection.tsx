'use client';

import { useMemo } from 'react';
import { boundField, type SectionProps } from './types';
import { parseEventDate } from '../types';
import { FramedInner } from './DressCodeSection';

const WEEKDAYS_KZ = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жс'];
const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateInputValue(iso: string): string {
  const d = parseEventDate(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CalendarSection({ ctx, bindings, sectionProps }: SectionProps) {
  const dateStr = boundField(bindings, 'eventDate', ctx.fields);
  const eventDate = parseEventDate(dateStr);
  const isKz = ctx.invitation.language === 'kz';
  const weekdays = isKz ? WEEKDAYS_KZ : WEEKDAYS_RU;
  const year = eventDate.getFullYear();
  const month = eventDate.getMonth();
  const eventDay = eventDate.getDate();
  const monthLabel = new Intl.DateTimeFormat(isKz ? 'kk-KZ' : 'ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(eventDate);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const frameKey = typeof sectionProps?.frame === 'string' ? sectionProps.frame : undefined;

  return (
    <section className="inv-section inv-manifest-calendar" data-section="calendar">
      <FramedInner ctx={ctx} frameKey={frameKey} className="inv-framed--date">
        <div className="inv-section__inner">
          <p className="inv-manifest-calendar__eyebrow">
            {isKz ? 'Той күні' : 'Дата торжества'}
          </p>
          <h2 className="inv-manifest-calendar__title">{monthLabel}</h2>
          {ctx.isEditing && ctx.onFieldSave ? (
            <div className="inv-manifest-calendar__edit-row mb-3 flex justify-center">
              <label className="sr-only" htmlFor="inv-calendar-date">
                {isKz ? 'Күнді өзгерту' : 'Изменить дату'}
              </label>
              <input
                id="inv-calendar-date"
                type="date"
                data-edit-field="eventDate"
                className="inv-editable-field inv-editable-field--date"
                value={toDateInputValue(dateStr)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  void ctx.onFieldSave?.('eventDate', v);
                }}
              />
            </div>
          ) : null}
          <div className="inv-manifest-calendar__grid" role="grid" aria-label={monthLabel}>
            {weekdays.map((d) => (
              <span key={d} className="inv-manifest-calendar__weekday" role="columnheader">
                {d}
              </span>
            ))}
            {cells.map((day, i) => (
              <span
                key={i}
                className={
                  day === eventDay
                    ? 'inv-manifest-calendar__day inv-manifest-calendar__day--event'
                    : 'inv-manifest-calendar__day'
                }
                role="gridcell"
              >
                {day ?? ''}
              </span>
            ))}
          </div>
        </div>
      </FramedInner>
    </section>
  );
}
