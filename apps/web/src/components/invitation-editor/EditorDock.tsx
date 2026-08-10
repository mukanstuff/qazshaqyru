'use client';

/**
 * EditorDock — bottom floating dock with category buttons.
 *
 * Replacement for the old right-side panel tabs. Each button opens a
 * centered floating modal with the corresponding editor section.
 *
 * State (which modal is open, edit vs preview mode) lives in EditorUiContext.
 */

import { useEffect, useState } from 'react';
import {
  ContentIcon,
  DesignIcon,
  MediaIcon,
  PublishIcon,
  UndoIcon,
  RedoIcon,
  CloseIcon,
  CheckIcon,
} from './icons';
import { useEditorUi } from '@/lib/templates/html-engine/editor/editor-ui';
import { useHtmlEditorStore, useHtmlEditorUi } from '@/lib/templates/html-engine/editor/store';
import { cn } from '@/lib/shared/utils';
import type { EditorTab } from '@/lib/templates/html-engine/editor/types';

const DOCK_ITEMS: Array<{
  id: EditorTab;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'content', label: 'Содержание',   hint: 'Имена, дата, место, RSVP',          icon: ContentIcon },
  { id: 'design',  label: 'Оформление',   hint: 'Цвета, анимации, шрифты',            icon: DesignIcon },
  { id: 'media',   label: 'Медиа',        hint: 'Музыка, фото, OG-карточка',          icon: MediaIcon },
  { id: 'publish', label: 'Публикация',   hint: 'Ссылка, публикация, поделиться',     icon: PublishIcon },
];

export function EditorDock() {
  const ui = useEditorUi();
  const { canUndo, canRedo, saveStatus, isDirty } = useHtmlEditorUi();
  const store = useHtmlEditorStore();
  const [hint, setHint] = useState<string | null>(null);

  if (ui.mode !== 'edit') return null;

  return (
    <div className="editor-dock" role="toolbar" aria-label="Редактор">
      <div className="editor-dock__group editor-dock__group--main">
        <button
          type="button"
          className="editor-dock__btn editor-dock__btn--icon"
          onClick={() => store.undo()}
          disabled={!canUndo}
          aria-label="Отменить"
          title="Отменить (⌘Z)"
        >
          <UndoIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="editor-dock__btn editor-dock__btn--icon"
          onClick={() => store.redo()}
          disabled={!canRedo}
          aria-label="Повторить"
          title="Повторить (⌘⇧Z)"
        >
          <RedoIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="editor-dock__group" role="group" aria-label="Разделы">
        {DOCK_ITEMS.map((item) => {
          const active = ui.openModal === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={cn('editor-dock__btn', active && 'editor-dock__btn--active')}
              onClick={() => (active ? ui.closeModal() : ui.openModal_(item.id))}
              onMouseEnter={() => setHint(item.hint)}
              onMouseLeave={() => setHint(null)}
              data-tab={item.id}
            >
              <item.icon className="h-4 w-4" />
              <span className="editor-dock__btn-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="editor-dock__group editor-dock__group--end">
        <SaveBadge status={saveStatus} isDirty={isDirty} />
        <button
          type="button"
          className="editor-dock__btn editor-dock__btn--icon"
          onClick={() => ui.exitEditMode()}
          aria-label="Закрыть редактор"
          title="Готово (Esc)"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {hint ? (
        <div className="editor-dock__hint" role="status">
          <span>{hint}</span>
        </div>
      ) : null}
    </div>
  );
}

function SaveBadge({ status, isDirty }: { status: 'idle' | 'saving' | 'saved' | 'error'; isDirty: boolean }) {
  if (status === 'saving') {
    return (
      <span className="editor-dock__badge">
        <span className="editor-dock__badge-dot editor-dock__badge-dot--spin" />
        Сохранение
      </span>
    );
  }
  if (status === 'error') {
    return <span className="editor-dock__badge editor-dock__badge--error">Ошибка</span>;
  }
  if (isDirty) {
    return (
      <span className="editor-dock__badge editor-dock__badge--dirty">
        <span className="editor-dock__badge-dot" />
        Изменения
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="editor-dock__badge editor-dock__badge--saved">
        <CheckIcon className="h-3 w-3" />
        Сохранено
      </span>
    );
  }
  return <span className="editor-dock__badge">Готово</span>;
}
