'use client';

import { ArrowRight } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  onAction: () => void;
  ready?: boolean;
}

/** Mobile-only gentle nudge — one CTA, no competing journey strip. */
export function LiveEditorNextCard({ title, description, onAction, ready = false }: Props) {
  return (
    <div className="live-editor-next-card" data-testid="live-editor-next-card">
      <div className="live-editor-next-card__copy">
        <p className="live-editor-next-card__eyebrow">
          {ready ? 'Почти готово' : 'Следующий шаг'}
        </p>
        <p className="live-editor-next-card__title">{title}</p>
        {description ? (
          <p className="live-editor-next-card__desc">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="live-editor-next-card__btn"
        onClick={onAction}
        data-testid="live-editor-next-card-btn"
      >
        <span>{ready ? 'Опубликовать' : 'Продолжить'}</span>
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
