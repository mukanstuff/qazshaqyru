'use client';

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { TextElement, HeadingElement, TextProps } from '@/lib/canvas/types';

interface Props {
  anchorRef: RefObject<HTMLElement | null>;
  el: TextElement | HeadingElement;
  onUpdate: (patch: Partial<TextProps>) => void;
}

/**
 * TextInlineToolbar — floating bar that appears above the edited text.
 *
 * Lives outside the contenteditable so clicks on its buttons don't blur
 * the text. We use `onPointerDown` with `preventDefault()` to keep focus.
 * Anchors itself to the element's bounding rect (re-measured on scroll /
 * resize). Hosts the most-used text controls so the user doesn't need to
 * hop to the right inspector for tiny tweaks.
 *
 * The colour picker is a compact horizontal strip of brand-friendly
 * swatches plus a native color input. We deliberately do NOT use the
 * full SwatchColorPicker (which has a dropdown) — it would be too large
 * here and would steal focus when opened.
 */
export function TextInlineToolbar({ anchorRef, el, onUpdate }: Props) {
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [showColor, setShowColor] = useState(false);

  // Measure & reposition on scroll/resize while mounted.
  useLayoutEffect(() => {
    const measure = () => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      const a = anchor.getBoundingClientRect();
      const p = pop.getBoundingClientRect();
      const desiredLeft = a.left + a.width / 2 - p.width / 2;
      const clampedLeft = Math.max(8, Math.min(window.innerWidth - p.width - 8, desiredLeft));
      const top = a.top - p.height - 12;
      setPos({ left: clampedLeft, top: Math.max(8, top) });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorRef]);

  // Click-outside on the color popover closes it.
  useEffect(() => {
    if (!showColor) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popRef.current?.contains(target)) return;
      setShowColor(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [showColor]);

  // Don't let pointerdown steal focus from the contenteditable.
  const swallow = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const apply = (patch: Partial<TextProps>) => onUpdate(patch);

  const toggleBold = () => apply({ fontWeight: el.fontWeight >= 600 ? 400 : 700 });
  const toggleItalic = () => apply({ italic: !el.italic });
  const stepSize = (delta: number) =>
    apply({ fontSize: Math.max(8, Math.min(200, el.fontSize + delta)) });
  const setAlign = (align: 'left' | 'center' | 'right') => apply({ textAlign: align });
  const setColor = (c: string) => apply({ color: c });

  const swatches = [
    '#1a1a1a', '#ffffff', '#6b1d3a', '#c9a961', '#2d5016',
    '#1a3a5c', '#8b1a1a', '#f59e0b', '#0ea5e9', '#9d8ec4',
  ];

  return (
    <div
      ref={popRef}
      role="toolbar"
      aria-label="Форматирование текста"
      className="canvas-text-toolbar"
      style={{
        position: 'fixed',
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        opacity: pos ? 1 : 0,
        transition: 'opacity 120ms ease',
        zIndex: 9999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Btn active={el.fontWeight >= 600} title="Жирный" onPointerDown={(e) => { swallow(e); toggleBold(); }}>
        <span style={{ fontWeight: 800 }}>B</span>
      </Btn>
      <Btn active={!!el.italic} title="Курсив" onPointerDown={(e) => { swallow(e); toggleItalic(); }}>
        <span style={{ fontStyle: 'italic' }}>I</span>
      </Btn>
      <Btn active={!!el.uppercase} title="КАПС" onPointerDown={(e) => { swallow(e); apply({ uppercase: !el.uppercase }); }}>
        <span style={{ letterSpacing: '-0.02em' }}>Аа</span>
      </Btn>

      <Divider />

      <Btn title="Мельче" onPointerDown={(e) => { swallow(e); stepSize(-2); }}>
        <span style={{ fontSize: 11 }}>A−</span>
      </Btn>
      <span className="canvas-text-toolbar__size">{el.fontSize}</span>
      <Btn title="Крупнее" onPointerDown={(e) => { swallow(e); stepSize(2); }}>
        <span style={{ fontSize: 14 }}>A+</span>
      </Btn>

      <Divider />

      <Btn active={el.textAlign === 'left'} title="По левому краю" onPointerDown={(e) => { swallow(e); setAlign('left'); }}>
        <AlignIcon kind="left" />
      </Btn>
      <Btn active={el.textAlign === 'center'} title="По центру" onPointerDown={(e) => { swallow(e); setAlign('center'); }}>
        <AlignIcon kind="center" />
      </Btn>
      <Btn active={el.textAlign === 'right'} title="По правому краю" onPointerDown={(e) => { swallow(e); setAlign('right'); }}>
        <AlignIcon kind="right" />
      </Btn>

      <Divider />

      <div className="canvas-text-toolbar__color-wrap">
        <button
          type="button"
          className="canvas-text-toolbar__color-trigger"
          aria-label="Цвет текста"
          title="Цвет текста"
          onPointerDown={swallow}
          onClick={() => setShowColor((s) => !s)}
          style={{ backgroundColor: el.color }}
        >
          <span className="canvas-text-toolbar__color-letter" style={{ color: el.color === '#ffffff' ? '#1a1a1a' : '#ffffff' }}>A</span>
        </button>
        {showColor && (
          <div
            className="canvas-text-toolbar__color-pop"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="canvas-text-toolbar__color-grid">
              {swatches.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    'canvas-text-toolbar__color-swatch' +
                    (el.color.toLowerCase() === c.toLowerCase() ? ' is-active' : '')
                  }
                  style={{ backgroundColor: c }}
                  title={c}
                  onClick={() => {
                    setColor(c);
                    setShowColor(false);
                  }}
                />
              ))}
              <label className="canvas-text-toolbar__color-picker" title="Произвольный цвет">
                <input
                  type="color"
                  value={el.color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <span aria-hidden="true">+</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  active,
  title,
  onPointerDown,
}: {
  children: React.ReactNode;
  active?: boolean;
  title: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active ? 'true' : undefined}
      onPointerDown={onPointerDown}
      className={'canvas-text-toolbar__btn' + (active ? ' is-active' : '')}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="canvas-text-toolbar__divider" aria-hidden="true" />;
}

function AlignIcon({ kind }: { kind: 'left' | 'center' | 'right' }) {
  const startX = kind === 'left' ? 2 : kind === 'right' ? 8 : 5;
  const endX = kind === 'left' ? 12 : kind === 'right' ? 14 : 11;
  const midStartX = kind === 'left' ? 2 : kind === 'right' ? 8 : 5;
  const midEndX = kind === 'left' ? 12 : kind === 'right' ? 14 : 11;
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="3" x2="14" y2="3" />
      <line x1={startX} y1="6.5" x2={endX} y2="6.5" />
      <line x1="2" y1="10" x2="14" y2="10" />
      <line x1={midStartX} y1="13" x2={midEndX} y2="13" />
    </svg>
  );
}
