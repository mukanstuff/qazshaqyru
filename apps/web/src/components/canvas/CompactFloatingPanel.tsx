'use client';

import { useEffect, useRef, useState } from 'react';
import type { CanvasElement, FontFamily, HeadingElement, TextElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from './SwatchColorPicker';

/**
 * 2026-08-17 (pilot-2): thin floating strip for text elements ONLY.
 *
 * Content edits happen inline on the canvas (single-tap). This strip
 * is just style controls — never text content — so it stays narrow
 * (~44px tall) and floats above/below the selected text without
 * obscuring it.
 *
 * Used only for `text` and `heading`. All other types use
 * ElementSettingsCard instead.
 */
interface Props {
  el: TextElement | HeadingElement;
  anchorRect: DOMRect;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

const FONT_OPTIONS: FontFamily[] = [
  'Inter', 'Montserrat', 'Manrope', 'Poppins',
  'Playfair Display', 'Cormorant', 'Lora', 'Cinzel', 'EB Garamond',
  'Great Vibes', 'Dancing Script', 'Pacifico',
  'system',
];

export function CompactFloatingPanel({ el, anchorRect, onUpdate, onDelete }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const panel = ref.current.getBoundingClientRect();
    const margin = 10;
    const spaceAbove = anchorRect.top;
    const placeAbove = spaceAbove >= panel.height + margin;
    const top = placeAbove
      ? anchorRect.top - panel.height - margin
      : anchorRect.bottom + margin;
    const desiredLeft = anchorRect.left + anchorRect.width / 2 - panel.width / 2;
    const left = Math.max(8, Math.min(window.innerWidth - panel.width - 8, desiredLeft));
    setPos({ top, left });
  }, [anchorRect, el.id]);

  return (
    <div
      ref={ref}
      className="editor-text-strip"
      role="toolbar"
      aria-label="Стиль текста"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 1100,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`editor-text-strip-btn ${el.fontWeight >= 600 ? 'is-active' : ''}`}
        onClick={() =>
          onUpdate({
            fontWeight: el.fontWeight >= 600 ? 400 : 700,
          } as Partial<CanvasElement>)
        }
        title="Жирность"
        aria-label="Жирность"
      >
        <b>B</b>
      </button>

      <button
        type="button"
        className={`editor-text-strip-btn ${el.italic ? 'is-active' : ''}`}
        onClick={() =>
          onUpdate({ italic: !el.italic } as Partial<CanvasElement>)
        }
        title="Курсив"
        aria-label="Курсив"
      >
        <i>I</i>
      </button>

      <select
        value={el.fontFamily}
        onChange={(e) =>
          onUpdate({ fontFamily: e.target.value as FontFamily } as Partial<CanvasElement>)
        }
        className="editor-text-strip-select"
        aria-label="Шрифт"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <div className="editor-text-strip-color">
        <SwatchColorPicker
          value={el.color}
          onChange={(c) => onUpdate({ color: c } as Partial<CanvasElement>)}
        />
      </div>

      <span className="editor-text-strip-divider" />

      <div className="editor-text-strip-align">
        {(['left', 'center', 'right'] as const).map((align) => (
          <button
            key={align}
            type="button"
            className={`editor-text-strip-btn ${el.textAlign === align ? 'is-active' : ''}`}
            onClick={() =>
              onUpdate({ textAlign: align } as Partial<CanvasElement>)
            }
            aria-label={`Выравнивание ${align}`}
            title={`Выравнивание ${align}`}
          >
            {align === 'left' ? '⇤' : align === 'center' ? '↔' : '⇥'}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="editor-text-strip-btn editor-text-strip-btn--danger"
        onClick={onDelete}
        title="Удалить"
        aria-label="Удалить"
      >
        �
      </button>
    </div>
  );
}
