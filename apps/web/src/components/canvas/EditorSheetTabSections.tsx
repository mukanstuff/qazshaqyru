'use client';

import { useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  editorSectionsFor,
  type EditorSection,
  sectionsFromDoc,
} from './ElementSettingsConfig';
import type { CanvasElement, InvitationCanvasDocument } from '@/lib/canvas/types';
import { updateElement } from '@/lib/canvas/mutations';
import { resolveFullSectionOrder, relayoutBySectionOrder, moveSectionInOrder } from '@/lib/canvas/section-reorder';

interface Props {
  document: InvitationCanvasDocument;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

/**
 * "Sections" tab — visibility toggle + vertical reorder per section.
 *
 * Toggling flips `hidden` for every element that matches the section's
 * `matches`. Reordering (up/down arrows, not drag-and-drop) repositions
 * every element in the moved sections via lib/canvas/section-reorder.ts —
 * the canvas has no separate ordering concept, elements are absolutely
 * positioned, so this is a real y-coordinate recompute, not an array swap.
 *
 * NOTE on "hidden" rendering:
 *   CanvasRenderer uses `opacity: 0` + `pointer-events: none` in editor mode
 *   (so the host can still see and re-toggle a hidden element), but fully
 *   unmounts `el.hidden === true` elements in guest mode — hidden content
 *   never reaches the published invitation's DOM.
 */
export function EditorSheetTabSections({ document, onDocumentChange }: Props) {
  const { t, locale } = useI18n();

  const unordered = useMemo(() => sectionsFromDoc(document, locale), [document, locale]);
  const fullOrder = useMemo(
    () => resolveFullSectionOrder(document.sectionOrder, locale),
    [document.sectionOrder, locale]
  );
  const summaries = useMemo(() => {
    const byId = new Map(unordered.map((s) => [s.section.id, s]));
    return fullOrder.map((id) => byId.get(id)).filter((s): s is (typeof unordered)[number] => !!s);
  }, [unordered, fullOrder]);
  // Only sections with at least one element actually render as rows below
  // (sectionsFromDoc already drops empty ones) — up/down must move within
  // that visible list, not the full built-in list, or pressing the arrow on
  // the topmost/bottommost VISIBLE row could silently swap with an empty,
  // invisible neighbor and look like the button did nothing.
  const visibleOrder = useMemo(() => summaries.map((s) => s.section.id), [summaries]);

  const moveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      const nextVisibleOrder = moveSectionInOrder(visibleOrder, sectionId, direction);
      if (nextVisibleOrder === visibleOrder) return;
      onDocumentChange(relayoutBySectionOrder(document, nextVisibleOrder, locale));
    },
    [document, visibleOrder, locale, onDocumentChange]
  );

  const hiddenCounts = useMemo(() => {
    const map = new Map<string, { total: number; hidden: number }>();
    for (const sec of editorSectionsFor(locale)) {
      const els = document.elements.filter((e) => sec.matches.includes(e.type));
      const hidden = els.filter((e) => e.hidden).length;
      map.set(sec.id, { total: els.length, hidden });
    }
    return map;
  }, [document.elements, locale]);

  const patchElements = useCallback(
    (section: EditorSection, hidden: boolean) => {
      const matched = document.elements.filter((e) => section.matches.includes(e.type));
      let next: InvitationCanvasDocument = document;
      for (const el of matched) {
        if ((el as CanvasElement).hidden === hidden) continue;
        next = updateElement(next, el.id, { hidden });
      }
      if (next !== document) onDocumentChange(next);
    },
    [document, onDocumentChange]
  );

  if (summaries.length === 0) {
    return (
      <p className="editor-sheet-empty">{t('invitation.edit.canvas.sheet.empty')}</p>
    );
  }

  return (
    <div className="editor-sheet-section-stack">
      <p className="editor-sheet-hint">
        {t('invitation.edit.canvas.sheet.sectionsHelp')}
      </p>
      <ul className="editor-sections-list">
        {summaries.map(({ section, elements }, index) => {
          const counts = hiddenCounts.get(section.id) ?? { total: 0, hidden: 0 };
          const allHidden = counts.total > 0 && counts.hidden === counts.total;
          const someHidden = counts.hidden > 0 && counts.hidden < counts.total;
          return (
            <li key={section.id} className="editor-section-row">
              <div className="editor-section-reorder">
                <button
                  type="button"
                  className="editor-section-reorder-btn"
                  disabled={index === 0}
                  onClick={() => moveSection(section.id, -1)}
                  aria-label={locale === 'ru' ? 'Переместить выше' : 'Жоғары жылжыту'}
                >
                  <ChevronUp size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="editor-section-reorder-btn"
                  disabled={index === summaries.length - 1}
                  onClick={() => moveSection(section.id, 1)}
                  aria-label={locale === 'ru' ? 'Переместить ниже' : 'Төмен жылжыту'}
                >
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
              </div>
              <span className="editor-section-icon" aria-hidden="true">
                {section.icon}
              </span>
              <div className="editor-section-meta">
                <span className="editor-section-label">{section.label}</span>
                <span className="editor-section-count">{elements.length}</span>
              </div>
              <ToggleSwitch
                checked={!allHidden}
                indeterminate={someHidden}
                onChange={(next) => patchElements(section, !next)}
                ariaLabel={`${section.label}: ${locale === 'ru' ? 'показать/скрыть' : 'көрсету/жасыру'}`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

function ToggleSwitch({ checked, indeterminate, onChange, ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-indeterminate={indeterminate ? 'true' : undefined}
      className="editor-toggle"
      onClick={() => onChange(!checked)}
    >
      <span className="editor-toggle-knob" />
    </button>
  );
}
