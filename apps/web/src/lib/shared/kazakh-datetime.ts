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
