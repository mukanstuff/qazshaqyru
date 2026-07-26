'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/shared/ornaments';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <PublicShell>
      <div className="us-container relative flex min-h-[62vh] flex-col items-center justify-center overflow-hidden py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--us-accent)_10%,transparent),transparent_55%)]"
        />
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-us-accent/15 bg-us-cream shadow-sm">
          <LogoMark size={40} color="var(--us-accent)" />
        </div>
        <div
          aria-hidden
          className="mb-6 flex items-center gap-3 text-us-accent/40"
        >
          <span className="h-px w-12 bg-current" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-current" />
          <span className="h-px w-12 bg-current" />
        </div>
        <h1 className="font-display text-3xl text-us-ink md:text-4xl">{t('errors.pageTitle')}</h1>
        <p className="mt-3 max-w-sm font-body text-sm leading-relaxed text-us-ink-muted">
          {t('errors.pageDesc')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="default" onClick={() => reset()}>
            {t('errors.reload')}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t('errors.goHome')}</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
