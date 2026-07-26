'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';

interface Props {
  show: boolean;
  removeHref?: string;
}

/** Public freemium watermark — visible until publication fee is paid. */
export function PublicPublishWatermark({ show, removeHref }: Props) {
  const { t } = useI18n();
  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3"
      data-testid="publish-watermark"
    >
      <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full bg-us-ink/85 px-3 py-2 text-white shadow-us-md backdrop-blur">
        <span className="font-body text-xs sm:text-sm">{t('public.watermark.label')}</span>
        {removeHref ? (
          <Link
            href={removeHref}
            className="rounded-full bg-white/15 px-2.5 py-1 font-body text-[11px] font-semibold hover:bg-white/25"
          >
            {t('public.watermark.remove')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
