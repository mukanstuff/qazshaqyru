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
  const btn =
    'inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700/60 disabled:opacity-40';

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-950/80 text-zinc-100 text-sm shrink-0 overflow-x-auto whitespace-nowrap">
      <button className={btn} onClick={p.onUndo} disabled={!p.canUndo} title="Ctrl/Cmd+Z">↶ {t('invitation.edit.canvas.undo')}</button>
      <button className={btn} onClick={p.onRedo} disabled={!p.canRedo} title="Ctrl/Cmd+Shift+Z">↷ {t('invitation.edit.canvas.redo')}</button>
      <span className="mx-2 h-5 w-px bg-zinc-800" />
      <div className="flex items-center gap-1 rounded bg-zinc-800 p-0.5">
        <button
          className={btn + (p.viewport === 'mobile' ? ' bg-[#6b1d3a]' : '')}
          onClick={() => p.onViewportChange('mobile')}
        >
          📱 {t('invitation.edit.canvas.mobile')}
        </button>
        <button
          className={btn + (p.viewport === 'desktop' ? ' bg-[#6b1d3a]' : '')}
          onClick={() => p.onViewportChange('desktop')}
        >
          🖥 {t('invitation.edit.canvas.desktop')}
        </button>
      </div>
      <span className="mx-2 h-5 w-px bg-zinc-800" />
      <select
        value={p.zoom}
        onChange={(e) => p.onZoomChange(Number(e.target.value))}
        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
      >
        <option value={0.5}>50%</option>
        <option value={0.75}>75%</option>
        <option value={1}>100%</option>
        <option value={1.25}>125%</option>
      </select>
      <button className={btn} onClick={() => p.onZoomChange(1)}>{t('invitation.edit.canvas.zoomFit')}</button>
      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={p.showGrid} onChange={p.onToggleGrid} />
        {t('invitation.edit.canvas.grid')}
      </label>
      <span className="mx-2 h-5 w-px bg-zinc-800" />
      {p.onOpenPresets && (
        <button className={btn} onClick={p.onOpenPresets}>
          ✨ {t('invitation.edit.canvas.presets')}
        </button>
      )}
      {p.onExportPNG && (
        <button className={btn} onClick={p.onExportPNG}>
          ⬇ {t('invitation.edit.canvas.exportPng')}
        </button>
      )}
      <button className={btn} onClick={p.onPreviewAnimations}>▶ {t('invitation.edit.canvas.animPreview')}</button>
      <button className={btn} onClick={p.onPreviewGuest}>👁 {t('invitation.edit.canvas.preview')}</button>

      <div className="ml-auto flex items-center gap-3">
        {p.mode === 'template-builder' && (
          <span className="text-xs text-[#c9a961] border border-[#c9a961]/40 rounded px-2 py-0.5">
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
    return <span className="text-xs text-zinc-400">⟳ {t('invitation.edit.canvas.saving')}</span>;
  }
  if (state === 'error') {
    return (
      <button onClick={onClick} className="text-xs text-rose-400 hover:underline">
        ⚠ {t('invitation.edit.canvas.saveError')}
      </button>
    );
  }
  if (state === 'saved') {
    return (
      <span className="text-xs text-emerald-400">
        ✓ {t('invitation.edit.canvas.saved')} · {formatAgo(lastSaved, locale)}
      </span>
    );
  }
  return <span className="text-xs text-zinc-500">{t('invitation.edit.canvas.idle')}</span>;
}