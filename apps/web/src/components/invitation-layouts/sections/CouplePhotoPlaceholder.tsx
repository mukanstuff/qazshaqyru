'use client';

import { Camera } from 'lucide-react';
import { useI18n } from '@/i18n';

export function CouplePhotoPlaceholder({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <div
      className={[
        'flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderColor: 'color-mix(in srgb, var(--inv-accent, #C4954A) 55%, transparent)',
        background: 'color-mix(in srgb, var(--inv-accent, #C4954A) 6%, #FAF7F2)',
      }}
    >
      <Camera
        className="h-8 w-8 opacity-60"
        style={{ color: 'var(--inv-accent, #C4954A)' }}
        aria-hidden
      />
      <p
        className="font-body text-sm leading-relaxed"
        style={{ color: 'color-mix(in srgb, var(--inv-text-dark, #3d3428) 75%, transparent)' }}
      >
        {t('public.coverPhotoEmpty')}
      </p>
    </div>
  );
}
