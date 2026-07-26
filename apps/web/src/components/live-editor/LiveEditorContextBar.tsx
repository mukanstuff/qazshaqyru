'use client';

import { Camera, EyeOff } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

interface Props {
  canHide: boolean;
  onPhoto: () => void;
  onHide: () => void;
}

export function LiveEditorContextBar({ canHide, onPhoto, onHide }: Props) {
  return (
    <div className="live-editor-ctx" role="toolbar" aria-label="Действия секции">
      <button type="button" className="live-editor-ctx__btn" onClick={onPhoto} data-testid="live-editor-photo">
        <Camera aria-hidden />
        Фото
      </button>
      <button
        type="button"
        className={cn('live-editor-ctx__btn', 'live-editor-ctx__btn--danger')}
        onClick={onHide}
        disabled={!canHide}
        title={canHide ? 'Скрыть секцию' : 'Эту секцию скрыть нельзя'}
        data-testid="live-editor-hide"
      >
        <EyeOff aria-hidden />
        Скрыть
      </button>
    </div>
  );
}
