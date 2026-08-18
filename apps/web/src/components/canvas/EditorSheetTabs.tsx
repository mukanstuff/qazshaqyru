'use client';

import { useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

export type SheetTabId = 'texts' | 'photos' | 'music' | 'sections' | 'design';

interface Props {
  defaultTab?: SheetTabId;
  children: Record<SheetTabId, ReactNode>;
}

/**
 * 2026-08-17: Horizontally scrollable text tabs inside the bottom sheet.
 *
 * - Default tab = "texts" (most-edited content).
 * - Active tab has bold weight + 2px accent underline. No icon, no card,
 *   no rounded pill — text-only underline to keep the chrome minimal.
 * - Tab order is horizontal-scroll on narrow phones.
 * - Tab content is mounted lazily on first selection and kept mounted
 *   afterwards — so switching tabs doesn't lose in-progress edits.
 */
export function EditorSheetTabs({ defaultTab = 'texts', children }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<SheetTabId>(defaultTab);
  const [mounted, setMounted] = useState<Set<SheetTabId>>(
    () => new Set([defaultTab])
  );

  const handleSelect = (id: SheetTabId) => {
    setActive(id);
    if (!mounted.has(id)) {
      const next = new Set(mounted);
      next.add(id);
      setMounted(next);
    }
  };

  const tabs: Array<{ id: SheetTabId; label: string }> = [
    { id: 'texts', label: t('invitation.edit.canvas.sheet.tabs.texts') },
    { id: 'photos', label: t('invitation.edit.canvas.sheet.tabs.photos') },
    { id: 'music', label: t('invitation.edit.canvas.sheet.tabs.music') },
    { id: 'sections', label: t('invitation.edit.canvas.sheet.tabs.sections') },
    { id: 'design', label: t('invitation.edit.canvas.sheet.tabs.design') },
  ];

  return (
    <div className="editor-sheet-tabs-host">
      <div
        className="editor-sheet-tabs"
        role="tablist"
        aria-label={t('invitation.edit.canvas.fab.title')}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn('editor-sheet-tab', isActive && 'is-active')}
              onClick={() => handleSelect(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="editor-sheet-panel" role="tabpanel" data-tab={active}>
        {(Array.from(mounted) as SheetTabId[]).map((id) => (
          <div
            key={id}
            hidden={id !== active}
            className="editor-sheet-panel-instance"
          >
            {children[id]}
          </div>
        ))}
      </div>
    </div>
  );
}
