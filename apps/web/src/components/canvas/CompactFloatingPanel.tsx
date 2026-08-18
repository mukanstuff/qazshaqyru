'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  CanvasElement,
  FontFamily,
  HeadingElement,
  TextElement,
} from '@/lib/canvas/types';
import { SwatchColorPicker } from './SwatchColorPicker';

/**
 * 2026-08-18 (Phase 1): unified floating strip rendered for EVERY selected
 * canvas element — text, heading, image, button, divider, couple-names, etc.
 *
 * Structure:
 *  - Quick style controls available in the strip itself.
 *  - A "more settings" cog button opens the ElementSettingsCard drill-down
 *    (rendered by CanvasEditor), where per-type extras live (label text,
 *    alt text, RSVP ask-*, divider style…).
 *  - Trash button always present (deletion is universal).
 *
 * Controls are gated per element type — what doesn't apply isn't rendered.
 * This keeps the strip compact while remaining a single component for
 * every selection (Bug #4 unification requirement).
 *
 * The previous "text-only" version of this file lived as CompactFloatingPanel
 * for text/heading. Behaviour for those types is preserved; visible controls
 * expanded (underline, font-size +/-, line-height, trash, cog).
 */
interface Props {
  el: CanvasElement;
  anchorRect: DOMRect;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  /** Open the per-type drill-down (ElementSettingsCard). */
  onOpenSettings?: () => void;
}

const FONT_OPTIONS: FontFamily[] = [
  'Inter', 'Montserrat', 'Manrope', 'Poppins',
  'Playfair Display', 'Cormorant', 'Lora', 'Cinzel', 'EB Garamond',
  'Great Vibes', 'Dancing Script', 'Pacifico',
  'system',
];

// ── Type predicates for the controls we expose ──────────────────────────────

function hasColor(el: CanvasElement): el is CanvasElement & { color: string } {
  return 'color' in el;
}
function hasBgColor(el: CanvasElement): el is CanvasElement & { bgColor: string } {
  return 'bgColor' in el;
}
function hasTextColor(el: CanvasElement): el is CanvasElement & { textColor: string } {
  return 'textColor' in el;
}

function isTextLike(el: CanvasElement): el is TextElement | HeadingElement {
  return el.type === 'text' || el.type === 'heading';
}

function hasFontFamily(el: CanvasElement): el is CanvasElement & { fontFamily: FontFamily } {
  return 'fontFamily' in el;
}

function hasFont(el: CanvasElement): el is CanvasElement & { font: FontFamily } {
  return 'font' in el;
}

function hasFontSize(el: CanvasElement): el is CanvasElement & { fontSize: number } {
  return 'fontSize' in el && typeof (el as { fontSize?: unknown }).fontSize === 'number';
}

function hasItalic(el: CanvasElement): el is CanvasElement & { italic?: boolean } {
  return 'italic' in el;
}

// "Underline"-able in the broad sense = anything that exposes a `text` field
// we can decorate; for text/heading alone we add a CSS class toggle (the
// actual underline styling lives in the renderer template).
function supportsUnderline(el: CanvasElement): el is TextElement | HeadingElement {
  return isTextLike(el);
}

function supportsTextAlign(el: CanvasElement): el is TextElement | HeadingElement {
  return isTextLike(el);
}

function supportsBold(el: CanvasElement): el is TextElement | HeadingElement {
  return isTextLike(el);
}

function supportsLineHeight(el: CanvasElement): el is TextElement | HeadingElement {
  return isTextLike(el);
}

// Couple-names uses `font` (not `fontFamily`) and exposes a single shared
// `fontSize`. Map so the unified toolbar can drive both.
function getFontFamily(el: CanvasElement): FontFamily | undefined {
  if (hasFontFamily(el)) return el.fontFamily;
  if (hasFont(el)) return el.font;
  return undefined;
}
function setFontFamily(el: CanvasElement, v: FontFamily): Partial<CanvasElement> {
  if (hasFontFamily(el)) return { fontFamily: v } as Partial<CanvasElement>;
  if (hasFont(el)) return { font: v } as Partial<CanvasElement>;
  return {};
}

// Minimum readable / maximum reasonable font sizes per element type.
const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 120;

export function CompactFloatingPanel({
  el,
  anchorRect,
  onUpdate,
  onDelete,
  onOpenSettings,
}: Props) {
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

  // Computed control availability — drives the render layout below.
  const textEl = isTextLike(el) ? el : null;
  const colorValue =
    (hasColor(el) && el.color) ||
    (hasBgColor(el) && (el as { bgColor: string }).bgColor) ||
    '#000000';
  const fontFamilyValue = getFontFamily(el);
  const fontSize = hasFontSize(el) ? (el as { fontSize: number }).fontSize : null;
  const canBold = textEl !== null;
  const canItalic = textEl !== null && hasItalic(el);
  const canUnderline = textEl !== null && supportsUnderline(el);
  const canAlign = textEl !== null && supportsTextAlign(el);
  const canLineHeight = textEl !== null && supportsLineHeight(el);
  const hasAnyFontSize = fontSize !== null;
  const hasAnyFontFamily = fontFamilyValue !== undefined;

  // `el.color` is the primary thing users want to recolor on a non-text
  // element. For elements that ONLY have bgColor/textColor (button), pick
  // the one that reads as "foreground".
  const recolorValue =
    hasColor(el) ? el.color
    : hasTextColor(el) ? (el as { textColor: string }).textColor
    : hasBgColor(el) ? (el as { bgColor: string }).bgColor
    : '#000000';

  return (
    <div
      ref={ref}
      className="editor-text-strip"
      role="toolbar"
      aria-label="Стиль элемента"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 1100,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── Type • family • bold/italic/underline ────────────────────────── */}
      {canBold && textEl && (
        <button
          type="button"
          className={`editor-text-strip-btn editor-text-strip-btn--bold ${textEl.fontWeight >= 600 ? 'is-active' : ''}`}
          onClick={() =>
            onUpdate({
              fontWeight: textEl.fontWeight >= 600 ? 400 : 700,
            } as Partial<CanvasElement>)
          }
          title="Жирность"
          aria-label="Жирность"
        >
          <b>B</b>
        </button>
      )}

      {canItalic && textEl && (
        <button
          type="button"
          className={`editor-text-strip-btn ${textEl.italic ? 'is-active' : ''}`}
          onClick={() =>
            onUpdate({ italic: !textEl.italic } as Partial<CanvasElement>)
          }
          title="Курсив"
          aria-label="Курсив"
        >
          <i>I</i>
        </button>
      )}

      {canUnderline && textEl && (
        <button
          type="button"
          className={`editor-text-strip-btn ${(textEl as { underline?: boolean }).underline ? 'is-active' : ''}`}
          onClick={() =>
            onUpdate({
              underline: !(textEl as { underline?: boolean }).underline,
            } as Partial<CanvasElement>)
          }
          title="Подчёркивание"
          aria-label="Подчёркивание"
        >
          <u>U</u>
        </button>
      )}

      {hasAnyFontFamily && fontFamilyValue && (
        <select
          value={fontFamilyValue}
          onChange={(e) =>
            onUpdate(setFontFamily(el, e.target.value as FontFamily))
          }
          className="editor-text-strip-select"
          aria-label="Шрифт"
          title="Шрифт"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      )}

      {/* ── Color ───────────────────────────────────────────────────────── */}
      <div className="editor-text-strip-color">
        <SwatchColorPicker
          value={recolorValue}
          onChange={(c) => {
            if (hasColor(el)) onUpdate({ color: c } as Partial<CanvasElement>);
            else if (hasTextColor(el))
              onUpdate({ textColor: c } as Partial<CanvasElement>);
            else if (hasBgColor(el))
              onUpdate({ bgColor: c } as Partial<CanvasElement>);
          }}
        />
      </div>

      <span className="editor-text-strip-divider" />

      {/* ── Align (text/heading only) ──────────────────────────────────── */}
      {canAlign && textEl && (
        <>
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              className={`editor-text-strip-btn editor-text-strip-btn--align ${textEl.textAlign === align ? 'is-active' : ''}`}
              onClick={() =>
                onUpdate({ textAlign: align } as Partial<CanvasElement>)
              }
              aria-label={`Выравнивание ${align}`}
              title={`Выравнивание ${align}`}
              data-align={align}
            >
              {align === 'left' ? '⇤' : align === 'center' ? '↔' : '⇥'}
            </button>
          ))}
        </>
      )}

      {/* ── Font size +/− + readout (when applicable) ─────────────────── */}
      {hasAnyFontSize && fontSize !== null && (
        <>
          <button
            type="button"
            className="editor-text-strip-btn editor-text-strip-btn--font-step"
            onClick={() =>
              onUpdate({
                fontSize: Math.max(FONT_SIZE_MIN, fontSize - 2),
              } as Partial<CanvasElement>)
            }
            title="Уменьшить шрифт"
            aria-label="Уменьшить шрифт"
          >
            A−
          </button>
          <span className="editor-text-strip-readout">{fontSize}</span>
          <button
            type="button"
            className="editor-text-strip-btn editor-text-strip-btn--font-step"
            onClick={() =>
              onUpdate({
                fontSize: Math.min(FONT_SIZE_MAX, fontSize + 2),
              } as Partial<CanvasElement>)
            }
            title="Увеличить шрифт"
            aria-label="Увеличить шрифт"
          >
            A+
          </button>
        </>
      )}

      {/* ── Line-height (text/heading only) ────────────────────────────── */}
      {canLineHeight && textEl && (
        <select
          value={String(textEl.lineHeight)}
          onChange={(e) =>
            onUpdate({
              lineHeight: Number(e.target.value),
            } as Partial<CanvasElement>)
          }
          className="editor-text-strip-select editor-text-strip-select--narrow"
          aria-label="Межстрочный интервал"
          title="Межстрочный интервал"
        >
          {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((v) => (
            <option key={v} value={String(v)}>
              ⤓ {v}
            </option>
          ))}
        </select>
      )}

      <span className="editor-text-strip-divider" />

      {/* ── More settings (drill-down) ─────────────────────────────────── */}
      {onOpenSettings && (
        <button
          type="button"
          className="editor-text-strip-btn"
          onClick={onOpenSettings}
          title="Ещё настройки"
          aria-label="Ещё настройки"
        >
          ⚙
        </button>
      )}

      {/* ── Trash ──────────────────────────────────────────────────────── */}
      <button
        type="button"
        className="editor-text-strip-btn editor-text-strip-btn--danger"
        onClick={onDelete}
        title="Удалить"
        aria-label="Удалить"
      >
        🗑
      </button>
    </div>
  );
}
