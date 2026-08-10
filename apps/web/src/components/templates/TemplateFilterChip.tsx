'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

interface TemplateFilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

export function TemplateFilterChip({
  label,
  active,
  onClick,
  icon: Icon,
}: TemplateFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-body text-sm transition-colors',
        active
          ? 'border-us-accent bg-us-accent text-white shadow-sm'
          : 'border-us-border bg-white text-us-ink-muted hover:border-us-accent/40 hover:text-us-ink',
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}