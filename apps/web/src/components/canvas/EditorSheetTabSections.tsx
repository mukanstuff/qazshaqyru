'use client';

import { useCallback, useMemo } from 'react';
import { useI18n } from '@/i18n';
import {
  EDITOR_SECTIONS,
  type EditorSection,
  sectionsFromDoc,
} from './ElementSettingsConfig';
import type { CanvasElement, InvitationCanvasDocument } from '@/lib/canvas/types';
import { updateElement } from '@/lib/canvas/mutations';

interface Props {
  document: InvitationCanvasDocument;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

/**
 * "Sections" tab — visibility toggle per section.
 *
 * Toggling flips `hidden` for every element that matches the section's
 * `matches`. There is NO drag-and-drop reordering in this revision.
 *
 * NOTE on "hidden" rendering (TODO):
 *   CanvasRenderer currently uses `opacity: 0` + `pointer-events: none`
 *   for `el.hidden === true`. That's good enough for editor preview but
 *   is a temporary workaround — for the published invitation view we
 *   eventually want full unmount (don't render at all). For now, this
 *   toggle is editor-only and uses the existing renderer behaviour.
 */
export function EditorSheetTabSections({ document, onDocumentChange }: Props) {
  const { t } = useI18n();

  const summaries = useMemo(() => sectionsFromDoc(document), [document]);

  const hiddenCounts = useMemo(() => {
    const map = new Map<string, { total: number; hidden: number }>();
    for (const sec of EDITOR_SECTIONS) {
      const els = document.elements.filter((e) => sec.matches.includes(e.type));
      const hidden = els.filter((e) => e.hidden).length;
      map.set(sec.id, { total: els.length, hidden });
    }
    return map;
  }, [document.elements]);

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
        {summaries.map(({ section, elements }) => {
          const counts = hiddenCounts.get(section.id) ?? { total: 0, hidden: 0 };
          const allHidden = counts.total > 0 && counts.hidden === counts.total;
          const someHidden = counts.hidden > 0 && counts.hidden < counts.total;
          return (
            <li key={section.id} className="editor-section-row">
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
                ariaLabel={`${section.label}: показать/скрыть`}
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
