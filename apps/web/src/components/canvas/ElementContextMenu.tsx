'use client';

import { useEffect } from 'react';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react';
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
      className="w-52 rounded-lg border border-us-border bg-us-surface py-1 shadow-us-xl font-body text-sm text-us-ink"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-us-border/30"
      >
        <Copy size={14} aria-hidden="true" /> {t('invitation.edit.canvas.duplicate')}
      </button>
      <button
        onClick={() => {
          onBringToFront();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-us-border/30"
      >
        <ArrowUpToLine size={14} aria-hidden="true" /> {t('invitation.edit.canvas.front')}
      </button>
      <button
        onClick={() => {
          onSendToBack();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-us-border/30"
      >
        <ArrowDownToLine size={14} aria-hidden="true" /> {t('invitation.edit.canvas.back')}
      </button>
      <button
        onClick={() => {
          onToggleLock();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-us-border/30"
      >
        {element.locked ? <Unlock size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
        {element.locked ? t('invitation.edit.canvas.unlock') : t('invitation.edit.canvas.lock')}
      </button>
      <button
        onClick={() => {
          onToggleHide();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-us-border/30"
      >
        {element.hidden ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
        {element.hidden ? t('invitation.edit.canvas.show') : t('invitation.edit.canvas.hide')}
      </button>
      <div className="my-1 border-t border-us-border" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} aria-hidden="true" /> {t('invitation.edit.canvas.delete')}
      </button>
    </div>
  );
}