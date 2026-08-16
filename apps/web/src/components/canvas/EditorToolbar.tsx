'use client';

import { useI18n } from '@/i18n';
import type { SaveState } from './CanvasEditor';

interface ToolbarProps {
  viewport: 'mobile' | 'desktop';
  onViewportChange: (v: 'mobile' | 'desktop') => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreviewGuest: () => void;
  onPreviewAnimations: () => void;
  onOpenPresets?: () => void;
  onExportPNG?: () => void;
  saveState: SaveState;
  lastSaved: Date | null;
  onSaveNow: () => void;
  mode: 'user' | 'template-builder';
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

      <div className="ct-viewport-group">
        <button
          className={`ct-btn ${p.viewport === 'mobile' ? 'is-active' : ''}`}
          onClick={() => p.onViewportChange('mobile')}
        >
          📱 {t('invitation.edit.canvas.mobile')}
        </button>
        <button
          className={`ct-btn ${p.viewport === 'desktop' ? 'is-active' : ''}`}
          onClick={() => p.onViewportChange('desktop')}
        >
          🖥 {t('invitation.edit.canvas.desktop')}
        </button>
      </div>

      <span className="ct-divider" />

      <select
        value={p.zoom}
        onChange={(e) => p.onZoomChange(Number(e.target.value))}
        className="canvas-inspector-input"
        style={{ width: 'auto', display: 'inline-flex', padding: '4px 24px 4px 8px', fontSize: '12px' }}
      >
        <option value={0.5}>50%</option>
        <option value={0.75}>75%</option>
        <option value={1}>100%</option>
        <option value={1.25}>125%</option>
      </select>

      <button className="ct-btn" onClick={() => p.onZoomChange(1)}>
        {t('invitation.edit.canvas.zoomFit')}
      </button>

      <label className="ct-btn" style={{ gap: '6px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={p.showGrid}
          onChange={p.onToggleGrid}
          style={{ accentColor: 'var(--ed-accent)' }}
        />
        {t('invitation.edit.canvas.grid')}
      </label>

      <span className="ct-divider" />

      {p.onOpenPresets && (
        <button className="ct-btn" onClick={p.onOpenPresets}>
          ✨ {t('invitation.edit.canvas.presets')}
        </button>
      )}

      {p.onExportPNG && (
        <button className="ct-btn" onClick={p.onExportPNG}>
          ⬇ {t('invitation.edit.canvas.exportPng')}
        </button>
      )}

      <button className="ct-btn" onClick={p.onPreviewAnimations}>
        ▶ {t('invitation.edit.canvas.animPreview')}
      </button>

      <button className="ct-btn" onClick={p.onPreviewGuest}>
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
