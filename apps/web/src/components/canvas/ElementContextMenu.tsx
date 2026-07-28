'use client';

import { useEffect } from 'react';
import type { CanvasElement } from '@/lib/canvas/types';

interface Props {
  x: number;
  y: number;
  element: CanvasElement;
  locale: 'ru' | 'kz';
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
  locale,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleHide,
  onClose,
}: Props) {
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      onClose();
    };
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

  const labels =
    locale === 'ru'
      ? {
          duplicate: 'Дублировать',
          delete: 'Удалить',
          front: 'На передний план',
          back: 'На задний план',
          lock: element.locked ? 'Разблокировать' : 'Заблокировать',
          hide: element.hidden ? 'Показать' : 'Скрыть',
        }
      : {
          duplicate: 'Көшірмесін жасау',
          delete: 'Жою',
          front: 'Алдыңғы қатарға',
          back: 'Артқы қатарға',
          lock: element.locked ? 'Құлпын ашу' : 'Құлыптау',
          hide: element.hidden ? 'Көрсету' : 'Жасыру',
        };

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
        {labels.duplicate}
      </button>
      <button
        onClick={() => {
          onBringToFront();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {labels.front}
      </button>
      <button
        onClick={() => {
          onSendToBack();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {labels.back}
      </button>
      <button
        onClick={() => {
          onToggleLock();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {labels.lock}
      </button>
      <button
        onClick={() => {
          onToggleHide();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800"
      >
        {labels.hide}
      </button>
      <div className="my-1 border-t border-zinc-800" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-zinc-800"
      >
        {labels.delete}
      </button>
    </div>
  );
}
