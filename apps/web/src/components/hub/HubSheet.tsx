'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * 2026-08-18 (Phase 2, hub screen): generic bottom-sheet wrapper used by
 * every section in `HubSectionList`. Mobile-first (edge-to-edge, bottom
 * pinned). On wider screens the sheet is centred with a max-width.
 *
 * Behaviour:
 *  - Tap backdrop → close
 *  - Tap ✕       → close
 *  - Swipe handle down >100px or fast flick → close
 *  - ESC         → close
 *  - Body scroll locked while open
 */
export function HubSheet({ open, onClose, title, subtitle, children, footer }: Props) {
  const { t } = useI18n();
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<{ y: number; t: number } | null>(null);

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) setDragY(0);
  }, [open]);

  const handleHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartRef.current = { y: e.clientY, t: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleHandlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const dy = e.clientY - start.y;
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
        aria-label={t('common.close')}
        className="hub-sheet-backdrop hub-sheet-backdrop--open"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label={title}
        className="hub-sheet hub-sheet--open"
        style={{
          transform: `translateY(${dragY}px)`,
          opacity: dragY ? Math.max(0.7, 1 - dragY / 600) : undefined,
        }}
      >
        <div
          className="hub-sheet-handle"
          aria-label={t('invitation.edit.canvas.sheet.dragHandle')}
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerEnd}
          onPointerCancel={handleHandlePointerEnd}
        />
        <div className="hub-sheet-header">
          <div>
            <h2 className="hub-sheet-title">{title}</h2>
            {subtitle ? <p className="hub-sheet-subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="hub-sheet-close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="hub-sheet-body">{children}</div>
        {footer ? <div className="hub-sheet-footer">{footer}</div> : null}
      </div>
    </>
  );
}