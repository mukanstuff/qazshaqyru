'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';

interface Props {
  tableName: string | null | undefined;
  invitationSlug?: string;
}

/** Personal notice: which banquet table was assigned to this guest. */
export function GuestTableNotice({ tableName, invitationSlug }: Props) {
  const { t } = useI18n();
  if (!tableName) return null;

  return (
    <div
      className="mx-auto mb-4 max-w-md rounded-2xl border border-[color-mix(in_srgb,var(--inv-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--inv-accent)_10%,#fff)] px-4 py-3 text-center"
      data-testid="guest-table-notice"
    >
      <p className="font-body text-xs uppercase tracking-[0.18em] opacity-70">
        {t('public.seating.yourTable')}
      </p>
      <p className="font-display text-xl" style={{ color: 'var(--inv-accent)' }}>
        {tableName}
      </p>
      {invitationSlug && (
        <LocaleLink
          href={`/seating/${invitationSlug}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2"
          style={{ color: 'var(--inv-accent)' }}
        >
          {t('seating.publicCta')} →
        </LocaleLink>
      )}
    </div>
  );
}
