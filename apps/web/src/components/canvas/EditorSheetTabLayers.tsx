'use client';

import { useMemo } from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { CanvasElement, InvitationCanvasDocument } from '@/lib/canvas/types';
import { moveElement, updateElement } from '@/lib/canvas/mutations';
import { elementRowLabel, elementTypeName } from '@/lib/canvas/element-labels';

interface Props {
  document: InvitationCanvasDocument;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

/**
 * "Layers" tab — every element on the canvas, front to back.
 *
 * The editor could already hide, lock and restack an element, but only through
 * the right-click menu on that element, which means you had to find and hit the
 * thing first. That is exactly the case where you cannot: an element behind a
 * full-width photo, a hidden element (drawn at opacity 0 with pointer events
 * off — unclickable by construction), or a stack of five overlapping ornaments.
 * This lists them instead.
 *
 * Ordered by z-index descending, so the top row is what the guest sees on top —
 * the same convention as every design tool, and the reason the up arrow means
 * "forward" here rather than "earlier in the array".
 */
export function EditorSheetTabLayers({
  document,
  selectedId,
  onSelect,
  onDocumentChange,
}: Props) {
  const { locale } = useI18n();
  const t =
    locale === 'ru'
      ? {
          help: 'Верхний слой рисуется поверх остальных. Скрытый слой не попадёт в опубликованное приглашение.',
          empty: 'На холсте пока ничего нет.',
          forward: 'Выше',
          backward: 'Ниже',
          show: 'Показать',
          hide: 'Скрыть',
          lock: 'Заблокировать',
          unlock: 'Разблокировать',
        }
      : {
          help: 'Жоғарғы қабат бәрінің үстінен салынады. Жасырылған қабат жарияланған шақыруға кірмейді.',
          empty: 'Кенепте әзірге ештеңе жоқ.',
          forward: 'Жоғары',
          backward: 'Төмен',
          show: 'Көрсету',
          hide: 'Жасыру',
          lock: 'Бекіту',
          unlock: 'Бекітуді алу',
        };

  const ordered = useMemo(
    () => [...document.elements].sort((a, b) => b.zIndex - a.zIndex),
    [document.elements]
  );

  const toggle = (el: CanvasElement, patch: Partial<CanvasElement>) => {
    onDocumentChange(updateElement(document, el.id, patch));
  };

  if (ordered.length === 0) {
    return <p className="editor-sheet-empty">{t.empty}</p>;
  }

  return (
    <div className="editor-sheet-section-stack">
      <p className="editor-sheet-hint">{t.help}</p>
      <ul className="editor-layers-list">
        {ordered.map((el, index) => (
          <li
            key={el.id}
            className={`editor-layer-row${el.id === selectedId ? ' is-selected' : ''}${
              el.hidden ? ' is-hidden' : ''
            }`}
          >
            <div className="editor-section-reorder">
              <button
                type="button"
                className="editor-section-reorder-btn"
                disabled={index === 0}
                onClick={() => onDocumentChange(moveElement(document, el.id, 'forward'))}
                aria-label={t.forward}
              >
                <ChevronUp size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="editor-section-reorder-btn"
                disabled={index === ordered.length - 1}
                onClick={() => onDocumentChange(moveElement(document, el.id, 'backward'))}
                aria-label={t.backward}
              >
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            </div>

            {/*
              Selecting from here is the whole point — it reaches elements the
              canvas cannot be clicked on.
            */}
            <button type="button" className="editor-layer-name" onClick={() => onSelect(el.id)}>
              <span className="editor-layer-title">{elementRowLabel(el, locale)}</span>
              {/* Only when it adds something: an image row read "Сурет / Сурет". */}
              {elementRowLabel(el, locale) === elementTypeName(el.type, locale) ? null : (
                <span className="editor-layer-type">{elementTypeName(el.type, locale)}</span>
              )}
            </button>

            <button
              type="button"
              className="editor-layer-toggle"
              onClick={() => toggle(el, { hidden: !el.hidden })}
              aria-label={el.hidden ? t.show : t.hide}
              title={el.hidden ? t.show : t.hide}
            >
              {el.hidden ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="editor-layer-toggle"
              onClick={() => toggle(el, { locked: !el.locked })}
              aria-label={el.locked ? t.unlock : t.lock}
              title={el.locked ? t.unlock : t.lock}
            >
              {el.locked ? <Lock size={15} aria-hidden="true" /> : <Unlock size={15} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
