import {
  computeConfirmedHeadcount,
  computeExpectedHeadcount,
  seatsForRsvpStatus,
  type HeadcountGuest,
} from '@/lib/guests/headcount';

export type BanquetExportGuest = HeadcountGuest & {
  phone?: string | null;
  dietary?: string | null;
  tableName?: string | null;
  side?: string | null;
};

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV for banquet manager: seats, table, dietary, household. */
export function buildBanquetExportCsv(
  invitationTitle: string,
  guests: BanquetExportGuest[]
): string {
  const confirmed = computeConfirmedHeadcount(guests);
  const expected = computeExpectedHeadcount(guests);

  const header = [
    'household',
    'name',
    'phone',
    'side',
    'rsvp',
    'seats',
    'table',
    'dietary',
    'plus_one',
  ];

  const rows = guests.map((g) =>
    [
      escapeCsv((g.householdLabel?.trim() || g.name).trim()),
      escapeCsv(g.name),
      escapeCsv(g.phone ?? ''),
      escapeCsv(g.side ?? ''),
      escapeCsv(g.responseStatus ?? 'pending'),
      String(seatsForRsvpStatus(g.responseStatus, Boolean(g.hasPlusOne))),
      escapeCsv(g.tableName ?? ''),
      escapeCsv(g.dietary ?? ''),
      g.hasPlusOne ? 'yes' : 'no',
    ].join(',')
  );

  const summary = [
    `# ${invitationTitle}`,
    `# confirmed_seats=${confirmed}`,
    `# expected_seats=${expected}`,
    `# guests=${guests.length}`,
  ];

  return '\uFEFF' + [...summary, header.join(','), ...rows].join('\n');
}
