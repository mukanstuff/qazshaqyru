'use client';

import type { LayoutProps } from './types';
import { EditableField } from './EditableField';
import { formatDate, parseEventDate } from './types';

/** Functional shell only — visual design is rebuilt from scratch elsewhere. */
export function PlaceholderLayout({
  invitation,
  templateConfig,
  isEditing,
  onFieldSave,
  onOpenRSVP,
  canRSVP,
}: LayoutProps) {
  const dateLabel = formatDate(parseEventDate(invitation.eventDate));

  return (
    <article className="mx-auto max-w-md px-4 py-12 font-body text-us-ink">
      <header className="space-y-2 border-b border-us-border pb-6">
        {isEditing && onFieldSave ? (
          <EditableField
            value={invitation.title}
            field="title"
            onSave={onFieldSave}
            as="h1"
            className="text-2xl font-medium"
          />
        ) : (
          <h1 className="text-2xl font-medium">{invitation.title}</h1>
        )}
        <p className="text-sm text-us-ink-muted">{dateLabel}</p>
        {invitation.eventPlace ? (
          <p className="text-sm text-us-ink-muted">{invitation.eventPlace}</p>
        ) : null}
      </header>

      <p className="mt-8 text-sm text-us-ink-muted">
        {invitation.language === 'kz'
          ? 'Визуалды дизайн әзірленуде.'
          : 'Визуальный дизайн в разработке.'}
      </p>

      {canRSVP ? (
        <button
          type="button"
          onClick={onOpenRSVP}
          className="mt-8 rounded-md border border-us-border px-4 py-2 text-sm"
          style={{ color: templateConfig.accent }}
        >
          RSVP
        </button>
      ) : null}
    </article>
  );
}
