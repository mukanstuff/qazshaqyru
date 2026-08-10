'use client';

/**
 * EditorModal — centered floating modal that hosts a single editor panel.
 *
 * • Floats over the preview (full-screen canvas beneath).
 * • Click outside or X button closes the modal.
 * • Traps focus on open (loose).
 * • Built-in "title" + "subtitle" + "actions" header.
 *
 * Centering is done with `position: fixed; inset: 0; display: grid; place: center`
 * so the modal stays centered on any screen size.
 */

import { useCallback, useEffect, useRef } from 'react';
import { CloseIcon } from './icons';
import { useEditorUi } from '@/lib/templates/html-engine/editor/editor-ui';
import { cn } from '@/lib/shared/utils';
import type { EditorTab } from '@/lib/templates/html-engine/editor/types';

interface EditorModalProps {
  tab: EditorTab;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Optional element rendered at the right of the modal header. */
  headerExtra?: React.ReactNode;
  /** Modal width — default 440px. */
  width?: number;
  /** Variant: 'default' (dark glass) | 'light' (translucent over preview). */
  variant?: 'default' | 'translucent';
}

export function EditorModal({
  tab,
  title,
  subtitle,
  children,
  footer,
  headerExtra,
  width = 460,
  variant = 'default',
}: EditorModalProps) {
  const ui = useEditorUi();
  const isOpen = ui.openModal === tab;
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Capture initial focus when opening to restore on close
  useEffect(() => {
    if (isOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      // Auto-focus first focusable inside the modal
      const t = setTimeout(() => {
        const node = dialogRef.current?.querySelector<HTMLElement>(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
        );
        node?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
    lastFocusedRef.current?.focus?.();
  }, [isOpen]);

  // Close on outside click
  const onBackdropClick = useCallback(() => {
    ui.closeModal();
  }, [ui]);

  if (!isOpen) return null;

  return (
    <div
      className={cn('editor-modal-backdrop', variant === 'translucent' && 'editor-modal-backdrop--soft')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onBackdropClick();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`editor-modal-${tab}-title`}
    >
      <div
        ref={dialogRef}
        className="editor-modal"
        style={{ maxWidth: `min(${width}px, calc(100vw - 32px))` }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="editor-modal__header">
          <div className="editor-modal__header-titles">
            <h2 id={`editor-modal-${tab}-title`} className="editor-modal__title">{title}</h2>
            {subtitle ? <p className="editor-modal__subtitle">{subtitle}</p> : null}
          </div>
          <div className="editor-modal__header-actions">
            {headerExtra}
            <button
              type="button"
              onClick={() => ui.closeModal()}
              className="editor-modal__close"
              aria-label="Закрыть"
              title="Закрыть (Esc)"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="editor-modal__body">{children}</div>

        {footer ? <footer className="editor-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
