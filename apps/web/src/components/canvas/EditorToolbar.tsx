'use client';

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
  saveState: SaveState;
  lastSaved: Date | null;
  onSaveNow: () => void;
  locale: 'ru' | 'kz';
  mode: 'user' | 'template-builder';
}

const LABELS = {
  ru: {
    undo: 'Отменить',
    redo: 'Повторить',
    zoomFit: 'Вписать',
    mobile: 'Телефон',
    desktop: 'Десктоп',
    grid: 'Сетка',
    preview: 'Как видит гость',
    animPreview: 'Проиграть анимации',
    saving: 'Сохраняется…',
    saved: 'Сохранено',
    error: 'Ошибка — повторить',
    idle: '',
    templateBuilder: 'Режим шаблона',
  },
  kz: {
    undo: 'Болдырмау',
    redo: 'Қайталау',
    zoomFit: 'Экранға',
    mobile: 'Телефон',
    desktop: 'Десктоп',
    grid: 'Тор',
    preview: 'Қонақ көрінісі',
    animPreview: 'Анимацияларды қарау',
    saving: 'Сақталуда…',
    saved: 'Сақталды',
    error: 'Қате — қайталау',
    idle: '',
    templateBuilder: 'Үлгі режимі',
  },
};

function formatAgo(d: Date | null, locale: 'ru' | 'kz') {
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 5) return locale === 'ru' ? 'только что' : 'жаңа ғана';
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  return `${m} мин`;
}

export function EditorToolbar(p: ToolbarProps) {
  const L = LABELS[p.locale];
  const btn =
    'inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700/60 disabled:opacity-40';

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-950/80 text-zinc-100 text-sm shrink-0">
      <button className={btn} onClick={p.onUndo} disabled={!p.canUndo} title="Ctrl/Cmd+Z">↶ {L.undo}</button>
      <button className={btn} onClick={p.onRedo} disabled={!p.canRedo} title="Ctrl/Cmd+Shift+Z">↷ {L.redo}</button>
      <span className="mx-2 h-5 w-px bg-zinc-800" />
      <div className="flex items-center gap-1 rounded bg-zinc-800 p-0.5">
        <button
          className={btn + (p.viewport === 'mobile' ? ' bg-[#6b1d3a]' : '')}
          onClick={() => p.onViewportChange('mobile')}
        >
          📱 {L.mobile}
        </button>
        <button
          className={btn + (p.viewport === 'desktop' ? ' bg-[#6b1d3a]' : '')}
          onClick={() => p.onViewportChange('desktop')}
        >
          🖥 {L.desktop}
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
      <button className={btn} onClick={() => p.onZoomChange(1)}>{L.zoomFit}</button>
      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={p.showGrid} onChange={p.onToggleGrid} />
        {L.grid}
      </label>
      <span className="mx-2 h-5 w-px bg-zinc-800" />
      <button className={btn} onClick={p.onPreviewAnimations}>▶ {L.animPreview}</button>
      <button className={btn} onClick={p.onPreviewGuest}>👁 {L.preview}</button>

      <div className="ml-auto flex items-center gap-3">
        {p.mode === 'template-builder' && (
          <span className="text-xs text-[#c9a961] border border-[#c9a961]/40 rounded px-2 py-0.5">
            {L.templateBuilder}
          </span>
        )}
        <SaveIndicator state={p.saveState} onClick={p.onSaveNow} locale={p.locale} lastSaved={p.lastSaved} />
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
  const L = LABELS[locale];
  if (state === 'saving') {
    return <span className="text-xs text-zinc-400">⟳ {L.saving}</span>;
  }
  if (state === 'error') {
    return (
      <button onClick={onClick} className="text-xs text-rose-400 hover:underline">
        ⚠ {L.error}
      </button>
    );
  }
  if (state === 'saved') {
    return (
      <span className="text-xs text-emerald-400">
        ✓ {L.saved} · {formatAgo(lastSaved, locale)}
      </span>
    );
  }
  return <span className="text-xs text-zinc-500">{L.idle}</span>;
}
