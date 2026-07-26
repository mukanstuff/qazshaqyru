'use client';

import { Monitor, Smartphone, UserRound } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

export type PreviewMode = 'phone' | 'desktop' | 'guest';

interface Props {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}

const MODES: Array<{ id: PreviewMode; label: string; icon: typeof Smartphone }> = [
  { id: 'phone', label: 'Телефон', icon: Smartphone },
  { id: 'desktop', label: 'Десктоп', icon: Monitor },
  { id: 'guest', label: 'Гость', icon: UserRound },
];

export function LiveEditorPreviewModeSwitch({ mode, onChange }: Props) {
  return (
    <div className="live-editor-mode" role="group" aria-label="Режим превью" data-testid="live-editor-preview-mode">
      {MODES.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={cn('live-editor-mode__btn', mode === item.id && 'live-editor-mode__btn--active')}
            onClick={() => onChange(item.id)}
            title={item.label}
            data-testid={`live-editor-mode-${item.id}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
