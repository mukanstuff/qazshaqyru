'use client';

import { NotebookPen } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Props {
  onClick: () => void;
}

/**
 * 2026-08-17: Floating Action Button that opens the quick-edit bottom sheet.
 *
 * Tapping it is a toggle (parent owns open/closed state). When the sheet
 * is open this button is hidden so the close ✕ in the sheet doesn't
 * duplicate the action.
 *
 * Visual:
 *  - pill shape (var(--ed-radius-pill))
 *  - translucent emerald glass (low-alpha accent tint + backdrop blur)
 *    so the canvas reads through the button
 *  - soft neutral drop shadow (no green tint)
 *  - 0.96 scale on :active for tactile press feedback
 */
export function EditorFab({ onClick }: Props) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('invitation.edit.canvas.fab.open')}
      title={t('invitation.edit.canvas.fab.title')}
      className="editor-fab"
    >
      <NotebookPen size={16} aria-hidden="true" />
      <span className="editor-fab-label">{t('invitation.edit.canvas.fab.title')}</span>
    </button>
  );
}
