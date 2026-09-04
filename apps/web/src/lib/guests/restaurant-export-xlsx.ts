import ExcelJS from 'exceljs';
import {
  computeConfirmedHeadcount,
  computeExpectedHeadcount,
  seatsForRsvpStatus,
} from '@/lib/guests/headcount';
import type { BanquetExportGuest } from '@/lib/guests/restaurant-export';

/**
 * The same banquet list as the CSV, as a real .xlsx.
 *
 * CSV is a developer's format wearing a spreadsheet's name: Excel on a Russian
 * or Kazakh Windows uses ";" as its list separator, so a comma-delimited file
 * lands as one column of unreadable text and the тойхана manager has to run
 * the import wizard. This one opens.
 *
 * Column widths, a frozen header and a named sheet are not decoration — they
 * are what makes the file usable without touching a single setting.
 */
export type BanquetLocale = 'ru' | 'kz';

const HEADERS: Record<BanquetLocale, string[]> = {
  ru: ['Семья', 'Гость', 'Телефон', 'Сторона', 'Ответ', 'Мест', 'Стол', 'Пожелания по еде', 'С парой'],
  kz: ['Отбасы', 'Қонақ', 'Телефон', 'Жағы', 'Жауабы', 'Орын', 'Үстел', 'Тағамға тілек', 'Жұбымен'],
};

const RSVP_LABELS: Record<BanquetLocale, Record<string, string>> = {
  ru: {
    pending: 'ждём ответа',
    attending: 'придёт',
    attending_plus_one: 'придёт с парой',
    attending_no_children: 'придёт без детей',
    not_attending: 'не придёт',
  },
  kz: {
    pending: 'жауап күтілуде',
    attending: 'келеді',
    attending_plus_one: 'жұбымен келеді',
    attending_no_children: 'балаларсыз келеді',
    not_attending: 'келмейді',
  },
};

const SUMMARY_LABELS: Record<BanquetLocale, { confirmed: string; expected: string; guests: string; sheet: string }> = {
  ru: {
    confirmed: 'Подтверждено мест',
    expected: 'Ожидаем мест',
    guests: 'Гостей в списке',
    sheet: 'Гости',
  },
  kz: {
    confirmed: 'Расталған орын',
    expected: 'Күтілетін орын',
    guests: 'Тізімдегі қонақ',
    sheet: 'Қонақтар',
  },
};

const COLUMN_WIDTHS = [22, 26, 18, 12, 18, 8, 16, 26, 10];

export async function buildBanquetExportXlsx(
  invitationTitle: string,
  guests: BanquetExportGuest[],
  locale: BanquetLocale = 'ru'
): Promise<Uint8Array<ArrayBuffer>> {
  const L = SUMMARY_LABELS[locale];
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QazShaqyru';
  wb.created = new Date();

  const ws = wb.addWorksheet(L.sheet, {
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  const title = ws.addRow([invitationTitle]);
  title.font = { bold: true, size: 14 };
  ws.addRow([L.confirmed, computeConfirmedHeadcount(guests)]);
  ws.addRow([L.expected, computeExpectedHeadcount(guests)]);
  ws.addRow([L.guests, guests.length]);

  const header = ws.addRow(HEADERS[locale]);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF5F0' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFBFCDC4' } } };
  });

  for (const g of guests) {
    ws.addRow([
      (g.householdLabel?.trim() || g.name).trim(),
      g.name,
      g.phone ?? '',
      g.side ?? '',
      RSVP_LABELS[locale][g.responseStatus ?? 'pending'] ?? (g.responseStatus ?? 'pending'),
      seatsForRsvpStatus(g.responseStatus, Boolean(g.hasPlusOne)),
      g.tableName ?? '',
      g.dietary ?? '',
      g.hasPlusOne ? '+' : '',
    ]);
  }

  COLUMN_WIDTHS.forEach((width, i) => {
    ws.getColumn(i + 1).width = width;
  });
  // Phone numbers are text: "+77015550202" typed into a number column becomes
  // a formula error, and a bare "87015550202" loses its leading zero.
  ws.getColumn(3).numFmt = '@';

  ws.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: HEADERS[locale].length },
  };

  // Uint8Array, not Buffer: NextResponse's BodyInit does not accept Node's
  // Buffer type even though it is one at runtime.
  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
