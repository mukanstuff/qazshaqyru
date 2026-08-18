'use client';

import { useI18n } from '@/i18n';

/**
 * 2026-08-17 (pilot-2): three small floating clusters at the top of the
 * editor viewport. NO full-width toolbar — that was the old chrome.
 *
 *  ┌─ [← Back]  [↶ ↷]              [Publish] ──┐
 *
 * The clusters are absolutely positioned to the editor shell's corners
 * via the `data-editor-mode="admin"` selector in canvas-editor.css.
 *
 * Save-state feedback is intentionally NOT a permanent indicator next to
 * the Publish button — it lives in a short-lived toast (see CanvasEditor's
 * `savedToastVisible` / `saveErrorMessage` state). This file only owns
 * the chrome itself.
 *
 * Render this ONLY for `editorMode === 'admin'`. Guest/preview paths
 * keep using GuestCanvasHeader / the floating return-to-edit button.
 */
interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onPublish: () => void;
}

export function EditorFloatingClusters({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  onPublish,
}: Props) {
  const { t } = useI18n();

  return (
    <>
      <div className="editor-top-cluster editor-top-cluster--left">
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--icon editor-cluster-btn--back"
          onClick={onBack}
          aria-label={t('common.back')}
          title={t('common.back')}
        >
          ←
        </button>
        <span className="editor-cluster-divider editor-cluster-divider--strong" />
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--icon"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t('invitation.edit.canvas.undo')}
          title={t('invitation.edit.canvas.undo')}
        >
          ↶
        </button>
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--icon"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={t('invitation.edit.canvas.redo')}
          title={t('invitation.edit.canvas.redo')}
        >
          ↷
        </button>
      </div>

      <div className="editor-top-cluster editor-top-cluster--right">
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--primary"
          onClick={onPublish}
        >
          {t('invitation.edit.canvas.publish')}
        </button>
      </div>
    </>
  );
}
