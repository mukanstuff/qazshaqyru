'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * 2026-08-17: Bottom sheet for quick-edit.
 *
 * Geometry:
 *  - Mobile: fixed, bottom-anchored, 85dvh height, edge-to-edge.
 *  - Desktop (≥ 768px): centered card 480px wide, 80dvh tall, all corners rounded.
 *
 * Close:
 *  - Tap backdrop → close.
 *  - Tap ✕ → close.
 *  - Drag handle swipe-down > 100px → close.
 *  - ESC key → close (handled here so tab content components don't need to).
 *
 * Not a modal in the focus-trap sense — background canvas stays usable
 * for the few seconds a sheet is open if the user wants to compare with
 * the current document state. (Strict aria-modal can come later if needed.)
 */
export function EditorSheet({ open, onClose, children, className }: Props) {
  const { t } = useI18n();
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<{ y: number; t: number } | null>(null);

  // ESC handler.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while open (mobile).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset drag offset whenever the sheet is re-opened.
  useEffect(() => {
    if (open) setDragY(0);
  }, [open]);

  // Drag handle vertical swipe.
  const handleHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartRef.current = { y: e.clientY, t: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleHandlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const dy = e.clientY - start.y;
    // Only respond to downward drag (positive Y).
    setDragY(Math.max(0, dy));
  }, []);

  const handleHandlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!start) return;
      const dy = e.clientY - start.y;
      const elapsed = Date.now() - start.t;
      // Close if dragged >100px or fast flick (>300px in <300ms).
      if (dy > 100 || (dy > 60 && elapsed < 300)) {
        onClose();
      }
      setDragY(0);
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t('invitation.edit.canvas.sheet.close')}
        className="editor-sheet-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label={t('invitation.edit.canvas.fab.title')}
        className={cn('editor-sheet', className)}
        style={{
          // Live drag translate during swipe-down.
          transform: `translateY(${dragY}px)`,
          // Fade opacity slightly so the user gets visual closure feedback
          // even before the threshold is crossed.
          opacity: dragY ? Math.max(0.7, 1 - dragY / 600) : undefined,
        }}
        data-testid="editor-sheet"
      >
        <div
          className="editor-sheet-handle"
          aria-label={t('invitation.edit.canvas.sheet.dragHandle')}
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerEnd}
          onPointerCancel={handleHandlePointerEnd}
        >
          <div className="editor-sheet-handle-bar" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('invitation.edit.canvas.sheet.close')}
          className="editor-sheet-close"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className="editor-sheet-body">{children}</div>
      </div>
    </>
  );
}
