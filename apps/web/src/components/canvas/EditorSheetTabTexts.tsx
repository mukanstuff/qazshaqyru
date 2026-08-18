'use client';

import { useCallback } from 'react';
import { useI18n } from '@/i18n';
import type {
  ButtonElement,
  CanvasElement,
  CoupleNamesElement,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { updateElement } from '@/lib/canvas/mutations';
import { settingsTitleFor } from './ElementSettingsConfig';

interface Props {
  document: InvitationCanvasDocument;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

/**
 * "Texts" tab.
 *
 * Only edits content for `couple-names` (first/second) and `button` (label),
 * for elements present in the document. The `text`/`heading` content is
 * intentionally NOT surfaced here — per the pilot-2 contract, plain text
 * and headings are edited via in-place tap-to-edit on the canvas
 * (single tap). Two entry points would confuse users.
 */
export function EditorSheetTabTexts({ document, onDocumentChange }: Props) {
  const { t } = useI18n();

  const coupleEls = document.elements.filter(
    (e): e is CoupleNamesElement => e.type === 'couple-names'
  );
  const buttonEls = document.elements.filter(
    (e): e is ButtonElement => e.type === 'button'
  );

  const patchEl = useCallback(
    (id: string, patch: Partial<CanvasElement>) => {
      onDocumentChange(updateElement(document, id, patch));
    },
    [document, onDocumentChange]
  );

  if (coupleEls.length === 0 && buttonEls.length === 0) {
    return (
      <p className="editor-sheet-empty">{t('invitation.edit.canvas.sheet.empty')}</p>
    );
  }

  return (
    <div className="editor-sheet-section-stack">
      {coupleEls.map((el) => (
        <div key={el.id} className="editor-sheet-section">
          <h3 className="editor-sheet-section-title">{settingsTitleFor('couple-names')}</h3>
          <label className="editor-field">
            <span className="editor-field-label">Имя 1</span>
            <input
              type="text"
              className="canvas-inspector-input is-block"
              value={el.first ?? ''}
              onChange={(e) => patchEl(el.id, { first: e.target.value })}
            />
          </label>
          <label className="editor-field">
            <span className="editor-field-label">Имя 2</span>
            <input
              type="text"
              className="canvas-inspector-input is-block"
              value={el.second ?? ''}
              onChange={(e) => patchEl(el.id, { second: e.target.value })}
            />
          </label>
          <label className="editor-field">
            <span className="editor-field-label">Разделитель</span>
            <select
              className="canvas-inspector-input is-block"
              value={el.connector ?? '&'}
              onChange={(e) =>
                patchEl(el.id, { connector: e.target.value as CoupleNamesElement['connector'] })
              }
            >
              <option value="&">&amp;</option>
              <option value="heart">♥</option>
              <option value="ornament">❀</option>
              <option value="және">және</option>
              <option value="и">и</option>
            </select>
          </label>
        </div>
      ))}

      {buttonEls.map((el) => (
        <div key={el.id} className="editor-sheet-section">
          <h3 className="editor-sheet-section-title">{settingsTitleFor('button')}</h3>
          <label className="editor-field">
            <span className="editor-field-label">Текст</span>
            <input
              type="text"
              className="canvas-inspector-input is-block"
              value={el.label ?? ''}
              onChange={(e) => patchEl(el.id, { label: e.target.value })}
            />
          </label>
          <label className="editor-field">
            <span className="editor-field-label">Цвет фона</span>
            <input
              type="color"
              className="editor-color-chip"
              value={(el.bgColor ?? '#6b1d3a').toLowerCase()}
              onChange={(e) => patchEl(el.id, { bgColor: e.target.value })}
            />
          </label>
          <label className="editor-field">
            <span className="editor-field-label">Цвет текста</span>
            <input
              type="color"
              className="editor-color-chip"
              value={(el.textColor ?? '#ffffff').toLowerCase()}
              onChange={(e) => patchEl(el.id, { textColor: e.target.value })}
            />
          </label>
        </div>
      ))}
    </div>
  );
}
