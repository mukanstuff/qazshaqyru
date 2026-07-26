/** Build a minimal .ics file for "Add to calendar". */

export interface CalendarEventInput {
  title: string;
  eventDate: Date;
  eventTime?: string | null;
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

function parseEventStart(eventDate: Date, eventTime?: string | null): Date {
  const start = new Date(eventDate);
  if (!eventTime) {
    start.setHours(12, 0, 0, 0);
    return start;
  }
  const match = eventTime.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    start.setHours(12, 0, 0, 0);
    return start;
  }
  start.setHours(Number.parseInt(match[1], 10), Number.parseInt(match[2], 10), 0, 0);
  return start;
}

export function buildIcsContent(input: CalendarEventInput): string {
  const start = parseEventStart(input.eventDate, input.eventTime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const location = [input.eventPlace, input.address].filter(Boolean).join(', ');
  const baseUrl = (input.appUrl || '').replace(/\/$/, '');
  const url = baseUrl ? `${baseUrl}/i/${input.slug}` : undefined;
  const uid = `${input.slug}@invitation`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invitation//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
  ];

  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcsDataUrl(content: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
