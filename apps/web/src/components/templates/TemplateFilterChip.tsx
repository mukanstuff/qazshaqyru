'use client';

import { cn } from '@/lib/shared/utils';

interface TemplateFilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function TemplateFilterChip({ label, active, onClick }: TemplateFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-11 shrink-0 rounded-full border px-4 py-2 font-body text-sm font-medium transition-colors',
        active
          ? 'border-us-accent bg-us-accent text-white shadow-sm'
          : 'us-glass-soft border-us-border text-us-ink-muted hover:border-us-accent/30 hover:text-us-ink',
      )}
    >
      {label}
    </button>
  );
}
