'use client';

import { Eye, Layers, Pencil } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

/** Edit + guest preview only. Publish is a separate «готово» moment — not a third tab. */
export type MobileNavTab = 'edit' | 'preview';

interface Props {
  active: MobileNavTab;
  onChange: (tab: MobileNavTab) => void;
  readinessScore: number;
  onPrimaryAction: () => void;
  onSections?: () => void;
  primaryLabelReady?: string;
  primaryLabelNext?: string;
}

const TABS: Array<{ id: MobileNavTab; label: string; icon: typeof Eye }> = [
  { id: 'edit', label: 'Правка', icon: Pencil },
  { id: 'preview', label: 'Гость', icon: Eye },
];

export function LiveEditorBottomNav({
  active,
  onChange,
  readinessScore,
  onPrimaryAction,
  onSections,
  primaryLabelReady = 'Готово шарить',
  primaryLabelNext = 'Следующее поле',
}: Props) {
  const isReady = readinessScore >= 100;
  const primaryLabel = isReady ? primaryLabelReady : primaryLabelNext;

  return (
    <nav
      className="live-editor-bottom-nav"
      aria-label="Навигация редактора"
      data-testid="live-editor-bottom-nav"
    >
      <button
        type="button"
        className="live-editor-bottom-nav__primary"
        onClick={onPrimaryAction}
        data-testid="live-editor-nav-primary"
      >
        <span>{primaryLabel}</span>
      </button>
      <div className="live-editor-bottom-nav__tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                'live-editor-bottom-nav__btn',
                active === tab.id && 'live-editor-bottom-nav__btn--active',
              )}
              onClick={() => onChange(tab.id)}
              data-testid={`live-editor-nav-${tab.id}`}
            >
              <Icon aria-hidden />
              <span>{tab.label}</span>
            </button>
          );
        })}
        {onSections ? (
          <button
            type="button"
            className="live-editor-bottom-nav__btn"
            onClick={onSections}
            data-testid="live-editor-nav-sections"
          >
            <Layers aria-hidden />
            <span>Блоки</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}

export const LIVE_EDITOR_MOBILE_TABS = TABS.map((t) => t.id);
