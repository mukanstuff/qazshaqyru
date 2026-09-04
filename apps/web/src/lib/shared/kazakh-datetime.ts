/** Kazakh month names (nominative, uppercase) */
const MONTHS_KZ = [
  'ҚАНТАР', 'АҚПАН', 'НАУРЫЗ', 'СӘУІР', 'МАМЫР', 'МАУСЫМ',
  'ШІЛДЕ', 'ТАМЫЗ', 'ҚЫРКҮЙЕК', 'ҚАЗАН', 'ҚАРАША', 'ЖЕЛТОҚСАН',
] as const;

const MONTHS_RU = [
  'ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ',
  'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ',
] as const;

const WEEKDAYS_KZ = ['ДС', 'СС', 'СР', 'БС', 'ЖМ', 'СБ', 'ЖК'] as const;
const WEEKDAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] as const;

export function formatEventDateBanner(date: Date, locale: 'kz' | 'ru'): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = locale === 'kz' ? MONTHS_KZ[date.getMonth()] : MONTHS_RU[date.getMonth()];
  const year = date.getFullYear();
  if (locale === 'kz') return `${day} ${month} ${year} ЖЫЛ`;
  return `${day} ${month} ${year} ГОДА`;
}

/**
 * Compact "26 қыркүйек 2026 ж." / "26 сентября 2026 г." line, built from the
 * same fixed month tables as the banner formatter above rather than
 * `Intl`/`toLocaleDateString('kk-KZ', ...)`. Browser CLDR support for `kk-KZ`
 * is inconsistent — some browsers fall back to a placeholder pattern like
 * "2026 M09 26" instead of real month names, which differs from Node's
 * server-side ICU output and trips a hydration mismatch. A fixed table
 * guarantees the server and the client render the same string.
 */
export function formatEventDateLine(date: Date, locale: 'kz' | 'ru'): string {
  const day = date.getDate();
  const monthUpper = locale === 'kz' ? MONTHS_KZ[date.getMonth()] : MONTHS_RU[date.getMonth()];
  const month = monthUpper.toLowerCase();
  const year = date.getFullYear();
  return locale === 'kz' ? `${day} ${month} ${year} ж.` : `${day} ${month} ${year} г.`;
}

/**
 * Same as {@link formatEventDateLine}, but resolves the date's day/month/year
 * in a specific IANA time zone first (e.g. an event stored in UTC that must
 * always read as its Asia/Almaty calendar date). Only the numeric
 * year/month/day extraction goes through `Intl` — that part *is* reliably
 * supported everywhere — the month name itself still comes from the fixed
 * table so server and client agree.
 */
export function formatEventDateLineInTimeZone(
  date: Date,
  locale: 'kz' | 'ru',
  timeZone: string
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get('year');
  const monthIndex = get('month') - 1;
  const day = get('day');
  const monthUpper = locale === 'kz' ? MONTHS_KZ[monthIndex] : MONTHS_RU[monthIndex];
  const month = monthUpper.toLowerCase();
  return locale === 'kz' ? `${day} ${month} ${year} ж.` : `${day} ${month} ${year} г.`;
}

export function formatEventTimeBanner(time: string | null | undefined, locale: 'kz' | 'ru'): string {
  if (!time) return '';
  return locale === 'kz' ? `САҒАТ ${time}` : `В ${time}`;
}

export function getCalendarGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7; // Monday = 0
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
  return rows;
}

export function getWeekdayLabels(locale: 'kz' | 'ru'): readonly string[] {
  return locale === 'kz' ? WEEKDAYS_KZ : WEEKDAYS_RU;
}
