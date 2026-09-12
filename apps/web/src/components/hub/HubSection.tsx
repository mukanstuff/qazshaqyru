'use client';

import type { ReactNode } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

interface Props {
  title: string;
  description?: string;
  meta?: string;
  /**
   * How many things are inside — guests, texts, wishes.
   *
   * The competitor's hub puts a number on every card ("14 texts", "2 dates")
   * and it is the single cheapest thing that screen does: the owner learns
   * what is in a section without opening it, and a `0` is a to-do list. Ours
   * showed nothing, so every section looked equally full and equally empty.
   *
   * `undefined` renders no badge at all — a section with nothing countable
   * (design, template) must not show a meaningless zero.
   */
  count?: number;
  icon: ReactNode;
  onClick?: () => void;
  /**
   * Navigate instead of opening a sheet.
   *
   * A row whose only job is to go somewhere should go there. «Безендіру» used
   * to open a sheet that said "colours, fonts and decor are in the editor" and
   * offered Cancel and Open — a dialog whose entire content was the name of
   * the place the row already pointed at.
   */
  href?: string;
  locked?: boolean;
  negative?: boolean;
  disabled?: boolean;
}

/**
 * Single row in the hub section list. Mobile-first card-style list item,
 * opens a sheet on tap (or renders locked when the user hasn't paid).
 *
 * The icon chip is deliberately monochrome: colour here is reserved for
 * state (hover, locked, destructive) rather than being assigned per section,
 * which previously turned the list into a ten-colour rainbow.
 */
export function HubSection({
  title,
  description,
  meta,
  count,
  icon,
  onClick,
  href,
  locked = false,
  negative = false,
  disabled = false,
}: Props) {
  const className = cn(
    'hub-section',
    locked && 'hub-section--locked',
    negative && 'hub-section--negative'
  );

  const inner = (
    <>
      <span className="hub-section-icon">
        {locked ? <Lock size={18} aria-hidden="true" /> : icon}
      </span>
      <span className="hub-section-body">
        <span className="hub-section-title">
          {title}
          {typeof count === 'number' ? (
            <span className={cn('hub-section-count', count === 0 && 'hub-section-count--empty')}>
              {count}
            </span>
          ) : null}
        </span>
        {description ? <span className="hub-section-desc">{description}</span> : null}
        {meta ? <span className="hub-section-meta">{meta}</span> : null}
      </span>
      <span className="hub-section-chevron" aria-hidden="true">
        <ChevronRight size={18} />
      </span>
    </>
  );

  if (href && !locked && !disabled) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled || locked} className={className}>
      {inner}
    </button>
  );
}