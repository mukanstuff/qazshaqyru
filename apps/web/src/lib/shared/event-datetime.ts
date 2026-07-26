/**
 * Whether an event is in the past for RSVP purposes.
 * Uses the invitation timezone and treats "today" as open until end of day
 * (or until eventTime if set).
 */
export function isEventPast(
  eventDate: Date,
  eventTime?: string | null,
  eventTimezone = 'Asia/Almaty'
): boolean {
  const dayFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: eventTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayStr = dayFmt.format(new Date());
  const eventDayStr = dayFmt.format(eventDate);

  if (eventDayStr > todayStr) return false;
  if (eventDayStr < todayStr) return true;

  if (eventTime) {
    return resolveEventDateTime(eventDate, eventTime, eventTimezone).getTime() <= Date.now();
  }

  return false;
}

/**
 * Target instant for countdown timers (event date + optional time in invitation timezone).
 */
export function resolveEventDateTime(
  eventDate: Date | string,
  eventTime?: string | null,
  eventTimezone = 'Asia/Almaty'
): Date {
  const base = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;

  const dayFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: eventTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dayStr = dayFmt.format(base);

  let hours = 0;
  let minutes = 0;
  if (eventTime) {
    const match = eventTime.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
    }
  }

  const utcGuess = new Date(`${dayStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  const tzFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: eventTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = tzFmt.formatToParts(utcGuess);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  const asUtc = Date.UTC(
    parseInt(get('year'), 10),
    parseInt(get('month'), 10) - 1,
    parseInt(get('day'), 10),
    parseInt(get('hour'), 10),
    parseInt(get('minute'), 10)
  );

  const offset = asUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offset);
}
