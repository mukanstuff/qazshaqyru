'use client';

import type { ReactNode } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

interface Props {
  title: string;
  description?: string;
  meta?: string;
  icon: ReactNode;
  onClick?: () => void;
  locked?: boolean;
  negative?: boolean;
  disabled?: boolean;
}

/**
 * 2026-08-18 (Phase 2, hub screen): single row in the hub section list.
 * Mobile-first card-style list item, opens a sheet on tap (or shows a
 * locked card with the upgrade CTA if the user hasn't paid).
 */
export function HubSection({
  title,
  description,
  meta,
  icon,
  onClick,
  locked = false,
  negative = false,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || locked}
      className={cn(
        'hub-section',
        locked && 'hub-section--locked',
        negative && 'hub-section--negative'
      )}
    >
      <span className="hub-section-icon">{locked ? <Lock size={18} aria-hidden="true" /> : icon}</span>
      <span className="hub-section-body">
        <span className="hub-section-title">{title}</span>
        {description ? <span className="hub-section-desc">{description}</span> : null}
        {meta ? <span className="hub-section-meta">{meta}</span> : null}
      </span>
      <span className="hub-section-chevron" aria-hidden="true">
        <ChevronRight size={18} />
      </span>
    </button>
  );
}