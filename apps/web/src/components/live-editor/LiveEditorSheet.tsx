'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
  /** Hidden on desktop via CSS — avoids hydration branching in parent. */
  mobileOnly?: boolean;
}

export function LiveEditorSheet({ open, title, onClose, children, testId, mobileOnly }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={
        mobileOnly
          ? 'live-editor-sheet-root live-editor-sheet-root--mobile-only'
          : 'live-editor-sheet-root'
      }
      data-testid={testId}
    >
      <button
        type="button"
        className="live-editor-sheet__backdrop"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="live-editor-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="live-editor-sheet__handle" aria-hidden />
        <div className="live-editor-sheet__head">
          <h2 className="live-editor-sheet__title">{title}</h2>
          <button type="button" className="live-editor-sheet__close" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="live-editor-sheet__body">{children}</div>
      </div>
    </div>
  );
}
