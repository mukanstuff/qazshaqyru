'use client';

import type { CanvasElement, TextElement, HeadingElement, ButtonElement, ShapeElement, ImageElement, DividerElement, CoupleNamesElement, CountdownElement, RsvpFormElement, WishesElement, ProgramElement, MapElement, MusicPlayerElement, GiftBlockElement, QrCodeElement, LottieElement, VideoBgElement, OrnamentElement } from '@/lib/canvas/types';

interface Props {
  el: CanvasElement;
  zoom: number;
  onColorChange: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  currentColor?: string;
}

const PRESET_COLORS = [
  '#6b1d3a', '#c9a961', '#ffffff', '#000000',
  '#e8d5b7', '#2d5016', '#8b1a1a', '#1a3a5c',
  '#f5f0eb', '#4a3728', '#6b5b4f', '#c4a882',
];

// Which element types have a meaningful color property
function hasColor(el: CanvasElement): el is CanvasElement & { color: string } {
  return 'color' in el;
}

function hasBgColor(el: CanvasElement): el is CanvasElement & { bgColor: string } {
  return 'bgColor' in el;
}

function hasFontSize(el: CanvasElement): el is TextElement | HeadingElement | ButtonElement | CoupleNamesElement | CountdownElement | RsvpFormElement | WishesElement | ProgramElement | MusicPlayerElement | GiftBlockElement | LottieElement {
  const types = ['text', 'heading', 'button', 'couple-names', 'countdown', 'rsvp-form', 'wishes', 'program', 'music', 'gift', 'lottie'];
  return types.includes(el.type);
}

export function MiniToolbar({ el, zoom, onColorChange, onFontSizeChange, onDuplicate, onDelete, onUndo, onRedo, currentColor }: Props) {
  const elColor = hasColor(el) ? el.color : hasBgColor(el) ? (el as { bgColor: string }).bgColor : '#000000';
  const canChangeFontSize = hasFontSize(el);
  const elFontSize = hasFontSize(el) ? (el as { fontSize?: number }).fontSize : 16;

  return (
    <div
      className="absolute z-[1100] flex items-center gap-0.5 rounded-lg border border-zinc-600 bg-zinc-900/95 px-1.5 py-1 shadow-xl select-none"
      style={{
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Undo */}
      <button
        title="Отменить (Ctrl+Z)"
        onClick={onUndo}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10h10a5 5 0 0 1 5 5v2" /><polyline points="3 10 8 5 3 10 8 15" />
        </svg>
      </button>

      {/* Redo */}
      <button
        title="Вернуть (Ctrl+Y)"
        onClick={onRedo}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10H11a5 5 0 0 0 -5 5v2" /><polyline points="21 10 16 5 21 10 16 15" />
        </svg>
      </button>

      <div className="mx-1 h-4 w-px bg-zinc-700" />

      {/* Color swatches */}
      <div className="flex items-center gap-0.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onColorChange(c)}
            className="h-5 w-5 rounded-sm border border-zinc-600 hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Custom color via native picker */}
        <label className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-sm border border-zinc-600 hover:scale-110 transition-transform">
          <input
            type="color"
            value={elColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            style={{ width: '20px', height: '20px' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-400 pointer-events-none">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
            </svg>
          </span>
        </label>
      </div>

      <div className="mx-1 h-4 w-px bg-zinc-700" />

      {/* Font size — only for text-like elements */}
      {canChangeFontSize && (
        <>
          <button
            title="Уменьшить шрифт"
            onClick={() => onFontSizeChange(Math.max(8, elFontSize - 2))}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 text-xs font-bold"
          >
            A-
          </button>
          <span className="text-[10px] text-zinc-400 min-w-[24px] text-center">{elFontSize}</span>
          <button
            title="Увеличить шрифт"
            onClick={() => onFontSizeChange(Math.min(120, elFontSize + 2))}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 text-xs font-bold"
          >
            A+
          </button>
          <div className="mx-1 h-4 w-px bg-zinc-700" />
        </>
      )}

      {/* Duplicate */}
      <button
        title="Дублировать (Ctrl+D)"
        onClick={onDuplicate}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>

      {/* Delete */}
      <button
        title="Удалить (Delete)"
        onClick={onDelete}
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 hover:bg-rose-800 hover:text-rose-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}
