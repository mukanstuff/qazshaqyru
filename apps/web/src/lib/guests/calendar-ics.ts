/** Build a minimal .ics file for "Add to calendar". */

export interface CalendarEventInput {
  title: string;
  eventDate: Date;
  eventTime?: string | null;
  eventTimezone?: string | null;
  eventPlace?: string | null;
  address?: string | null;
  slug: string;
  appUrl?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Build a "wall clock + TZID" pair for an ICS DTSTART line. We map the event's
 * date+time as a wall-clock time in `eventTimezone` (default `Asia/Almaty`),
 * then derive the matching UTC instant for the floating-time pair. If the
 * timezone is unknown, we fall back to a UTC instant (`Z` suffix).
 *
 * The previous implementation used `Date#setHours` which is host-local — fine
 * when the ICS is generated on the organizer's machine, wrong for every other
 * guest whose calendar app would interpret the resulting UTC instant in the
 * guest's own timezone.
 */
function resolveEventStart(eventDate: Date, eventTime: string | null | undefined, eventTimezone: string | null | undefined): { utc: Date; tzid: string | null } {
  const timeStr = (eventTime ?? '').trim();
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  const hours = match ? Number.parseInt(match[1], 10) : 12;
  const minutes = match ? Number.parseInt(match[2], 10) : 0;

  const dateStr = formatLocalDate(eventDate);
  const tz = eventTimezone || 'Asia/Almaty';

  // Try to derive exact UTC instant for the wall-clock time in `tz`. If the
  // timezone isn't recognized by the runtime, `Intl.DateTimeFormat` still
  // formats but we can't reliably invert, so we fall back to UTC.
  const utc = tryResolveWallClockToUtc(dateStr, hours, minutes, tz);
  if (utc) return { utc, tzid: tz };

  // Unknown timezone: treat as UTC (still deterministic across hosts).
  return { utc: new Date(Date.UTC(
    eventDate.getUTCFullYear(),
    eventDate.getUTCMonth(),
    eventDate.getUTCDate(),
    hours,
    minutes,
    0,
    0,
  )), tzid: null };
}

function formatLocalDate(d: Date): string {
  // Reads UTC fields so the wall-clock date isn't shifted by the host TZ.
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function tryResolveWallClockToUtc(dateStr: string, hours: number, minutes: number, tz: string): Date | null {
  try {
    // Two-pass approach: compute the UTC instant for the wall-clock time, then
    // adjust by the offset that `tz` has at that instant. This survives DST
    // transitions because we recompute on the candidate.
    const hh = pad(hours);
    const mm = pad(minutes);
    const guess = new Date(`${dateStr}T${hh}:${mm}:00Z`);
    if (Number.isNaN(guess.getTime())) return null;

    const offsetMinutes = getTimezoneOffsetMinutes(tz, guess);
    if (offsetMinutes === null) return null;
    // If tz is UTC+5, the wall-clock time is 5 hours ahead of UTC instant.
    return new Date(guess.getTime() - offsetMinutes * 60_000);
  } catch {
    return null;
  }
}

function getTimezoneOffsetMinutes(tz: string, instant: Date): number | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = fmt.formatToParts(instant);
    const map: Record<string, number> = {};
    for (const p of parts) if (p.type !== 'literal') map[p.type] = Number.parseInt(p.value, 10);
    if (map.hour === 24) map.hour = 0;
    const asUtc = Date.UTC(
      map.year ?? 1970,
      (map.month ?? 1) - 1,
      map.day ?? 1,
      map.hour ?? 0,
      map.minute ?? 0,
      map.second ?? 0,
    );
    return Math.round((asUtc - instant.getTime()) / 60_000);
  } catch {
    return null;
  }
}

export function buildIcsContent(input: CalendarEventInput): string {
  const { utc: start, tzid } = resolveEventStart(input.eventDate, input.eventTime, input.eventTimezone);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const location = [input.eventPlace, input.address].filter(Boolean).join(', ');
  const baseUrl = (input.appUrl || '').replace(/\/$/, '');
  const url = baseUrl ? `${baseUrl}/i/${input.slug}` : undefined;
  const uid = `${input.slug}@invitation`;

  const dtstart = tzid
    ? `DTSTART;TZID=${tzid}:${formatLocalIcsDate(start, tzid)}`
    : `DTSTART:${toIcsUtc(start)}`;
  const dtend = tzid
    ? `DTEND;TZID=${tzid}:${formatLocalIcsDate(end, tzid)}`
    : `DTEND:${toIcsUtc(end)}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invitation//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    dtstart,
    dtend,
    `SUMMARY:${escapeIcsText(input.title)}`,
  ];

  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

/** Format the wall-clock time of `instant` in `tz` as `YYYYMMDDTHHMMSS` (no Z). */
function formatLocalIcsDate(instant: Date, tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = fmt.formatToParts(instant);
    const map: Record<string, number> = {};
    for (const p of parts) if (p.type !== 'literal') map[p.type] = Number.parseInt(p.value, 10);
    if (map.hour === 24) map.hour = 0;
    return `${map.year}${pad(map.month ?? 1)}${pad(map.day ?? 1)}T${pad(map.hour ?? 0)}${pad(map.minute ?? 0)}${pad(map.second ?? 0)}`;
  } catch {
    return toIcsUtc(instant).replace('Z', '');
  }
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcsDataUrl(content: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
