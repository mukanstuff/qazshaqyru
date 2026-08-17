'use client';

import { useI18n } from '@/i18n';
import type { SaveState } from './CanvasEditor';

/**
 * 2026-08-17 (pilot-2): three small floating clusters at the top of the
 * editor viewport. NO full-width toolbar — that was the old chrome.
 *
 *  ┌─ [← Back]  [↶ ↷]              [↻ · saved 3s · Publish] ─┐
 *
 * The clusters are absolutely positioned to the editor shell's corners
 * via the `data-editor-mode="admin"` selector in canvas-editor.css.
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
  saveState: SaveState;
  lastSaved: Date | null;
  onSaveNow: () => void;
  onPublish: () => void;
}

function formatAgo(d: Date | null, locale: 'ru' | 'kz'): string {
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 5) return locale === 'ru' ? 'только что' : 'жаңа ғана';
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  return `${m} мин`;
}

export function EditorFloatingClusters({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  saveState,
  lastSaved,
  onSaveNow,
  onPublish,
}: Props) {
  const { t, locale } = useI18n();

  return (
    <>
      <div className="editor-top-cluster editor-top-cluster--left">
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--icon"
          onClick={onBack}
          aria-label={t('common.back')}
          title={t('common.back')}
        >
          ←
        </button>
        <span className="editor-cluster-divider" />
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--icon"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t('invitation.edit.canvas.undo')}
          title="Ctrl/Cmd+Z"
        >
          ↶
        </button>
        <button
          type="button"
          className="editor-cluster-btn editor-cluster-btn--icon"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={t('invitation.edit.canvas.redo')}
          title="Ctrl/Cmd+Shift+Z"
        >
          ↷
        </button>
      </div>

      <div className="editor-top-cluster editor-top-cluster--right">
        <SaveCluster
          state={saveState}
          lastSaved={lastSaved}
          onClick={onSaveNow}
          locale={locale}
        />
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

function SaveCluster({
  state,
  lastSaved,
  onClick,
  locale,
}: {
  state: SaveState;
  lastSaved: Date | null;
  onClick: () => void;
  locale: 'ru' | 'kz';
}) {
  const { t } = useI18n();
  const ago = formatAgo(lastSaved, locale);

  if (state === 'saving') {
    return <span className="editor-save-pill is-saving">⟳ {t('invitation.edit.canvas.saving')}</span>;
  }
  if (state === 'error') {
    return (
      <button
        type="button"
        className="editor-save-pill is-error"
        onClick={onClick}
      >
        ⚠ {t('invitation.edit.canvas.saveError')}
      </button>
    );
  }
  if (state === 'saved') {
    return (
      <span className="editor-save-pill is-saved">
        ✓ {t('invitation.edit.canvas.saved')} · {ago}
      </span>
    );
  }
  return <span className="editor-save-pill is-idle">{t('invitation.edit.canvas.idle')}</span>;
}
