'use client';

import { useI18n } from '@/i18n';
import type { SaveState } from './CanvasEditor';

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveState: SaveState;
  lastSaved: Date | null;
  onSaveNow: () => void;
  mode: 'user' | 'template-builder';
  /**
   * 2026-08-17: in-app "guest view" preview. When true, the canvas
   * renders clean (no chrome, no selection handles) but the editor
   * state — selected element, history, autosave — is preserved.
   * Distinct from editorMode="guest" which is a separate visitor surface.
   */
  previewMode: boolean;
  onTogglePreview: () => void;
}

function formatAgo(d: Date | null, locale: 'ru' | 'kz') {
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 5) return locale === 'ru' ? 'только что' : 'жаңа ғана';
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  return `${m} мин`;
}

export function EditorToolbar(p: ToolbarProps) {
  const { t, locale } = useI18n();

  return (
    <header className="canvas-toolbar">
      <button className="ct-btn" onClick={p.onUndo} disabled={!p.canUndo} title="Ctrl/Cmd+Z">
        ↶ {t('invitation.edit.canvas.undo')}
      </button>
      <button className="ct-btn" onClick={p.onRedo} disabled={!p.canRedo} title="Ctrl/Cmd+Shift+Z">
        ↷ {t('invitation.edit.canvas.redo')}
      </button>
      <span className="ct-divider" />

      <button
        className={`ct-btn ${p.previewMode ? 'is-active' : ''}`}
        onClick={p.onTogglePreview}
        aria-pressed={p.previewMode}
      >
        👁 {t('invitation.edit.canvas.preview')}
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {p.mode === 'template-builder' && (
          <span className="ct-badge">
            {t('invitation.edit.canvas.templateBuilder')}
          </span>
        )}
        <SaveIndicator state={p.saveState} onClick={p.onSaveNow} locale={locale} lastSaved={p.lastSaved} />
      </div>
    </header>
  );
}

function SaveIndicator({
  state,
  onClick,
  locale,
  lastSaved,
}: {
  state: SaveState;
  onClick: () => void;
  locale: 'ru' | 'kz';
  lastSaved: Date | null;
}) {
  const { t } = useI18n();
  if (state === 'saving') {
    return <span className="ct-save-indicator is-saving">⟳ {t('invitation.edit.canvas.saving')}</span>;
  }
  if (state === 'error') {
    return (
      <button onClick={onClick} className="ct-save-indicator is-error" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        ⚠ {t('invitation.edit.canvas.saveError')}
      </button>
    );
  }
  if (state === 'saved') {
    return (
      <span className="ct-save-indicator is-saved">
        ✓ {t('invitation.edit.canvas.saved')} · {formatAgo(lastSaved, locale)}
      </span>
    );
  }
  return <span className="ct-save-indicator is-idle">{t('invitation.edit.canvas.idle')}</span>;
}