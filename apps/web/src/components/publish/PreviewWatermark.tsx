'use client';

import { cn } from '@/lib/shared/utils';

interface Props {
  label?: string;
  className?: string;
}

/** Simple CSS overlay for unpublished draft/preview pages. */
export function PreviewWatermark({ label = 'Предпросмотр', className }: Props) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3', className)}
      aria-hidden
    >
      <span className="rounded-full bg-us-ink/75 px-3 py-1 font-body text-[10px] font-medium uppercase tracking-wider text-white shadow-us-sm backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
