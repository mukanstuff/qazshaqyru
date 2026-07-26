'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';
import type { InvitationDocumentSection } from '@/lib/invitations/document';
import { getSectionLabel } from './section-labels';
import { cn } from '@/lib/shared/utils';
import { useI18n } from '@/i18n';

interface Props {
  sections: InvitationDocumentSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
}

export function LiveEditorSectionsSheetBody({
  sections,
  activeSectionId,
  onSelect,
  onMove,
  onToggleVisible,
}: Props) {
  const { t } = useI18n();

  return (
    <ul className="m-0 list-none p-0">
      {sections.map((section) => {
        const label = getSectionLabel(section.type, section.id, t);
        const active = section.id === activeSectionId;
        return (
          <li
            key={section.id}
            className={cn(
              'live-editor-section-row',
              active && 'live-editor-section-row--active',
              !section.visible && 'live-editor-section-row--hidden',
            )}
          >
            <button
              type="button"
              className="live-editor-section-row__main"
              onClick={() => onSelect(section.id)}
            >
              <span className="live-editor-section-row__label">{label}</span>
              <span className="live-editor-section-row__id">{section.id}</span>
            </button>
            <div className="live-editor-section-row__actions">
              {section.canReorder ? (
                <>
                  <button
                    type="button"
                    className="live-editor-icon-btn"
                    aria-label="Вверх"
                    onClick={() => onMove(section.id, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="live-editor-icon-btn"
                    aria-label="Вниз"
                    onClick={() => onMove(section.id, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : null}
              {section.canHide ? (
                <button
                  type="button"
                  className="live-editor-icon-btn"
                  aria-label={section.visible ? 'Скрыть' : 'Показать'}
                  onClick={() => onToggleVisible(section.id, !section.visible)}
                >
                  {section.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
