'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/shared/utils';

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title?: string;
  icon: ReactNode;
  label?: string;
  className?: string;
}

export function ToolbarButton({
  active = false,
  onClick,
  title,
  icon,
  label,
  className,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 font-body text-xs font-medium transition-colors',
        active
          ? 'bg-us-accent/10 text-us-accent ring-1 ring-us-accent/25'
          : 'text-us-ink-muted hover:bg-us-accent/6 hover:text-us-accent',
        className
      )}
      title={title ?? label}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      {label ? <span className="whitespace-nowrap">{label}</span> : null}
    </button>
  );
}
