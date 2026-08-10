'use client';

import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import type { CanvasElement } from '@/lib/canvas/types';

interface Props {
  x: number;
  y: number;
  element: CanvasElement;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClose: () => void;
}

export function ElementContextMenu({
  x,
  y,
  element,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleHide,
  onClose,
}: Props) {
  useEffect(() => {
    const handleDown = () => onClose();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const { t } = useI18n();

  return (
    <div
      style={{ position: 'fixed', left: x, top: y, zIndex: 10000 }}
      className="w-48 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl text-xs text-zinc-200"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {t('invitation.edit.canvas.duplicate')}
      </button>
      <button
        onClick={() => {
          onBringToFront();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {t('invitation.edit.canvas.front')}
      </button>
      <button
        onClick={() => {
          onSendToBack();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {t('invitation.edit.canvas.back')}
      </button>
      <button
        onClick={() => {
          onToggleLock();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {element.locked ? t('invitation.edit.canvas.unlock') : t('invitation.edit.canvas.lock')}
      </button>
      <button
        onClick={() => {
          onToggleHide();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {element.hidden ? t('invitation.edit.canvas.show') : t('invitation.edit.canvas.hide')}
      </button>
      <div className="my-1 border-t border-zinc-800" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-zinc-800"
      >
        {t('invitation.edit.canvas.delete')}
      </button>
    </div>
  );
}