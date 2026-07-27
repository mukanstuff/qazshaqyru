/**
 * useDrag — low-level pointer-based drag hook that maps pointer events
 * (mouse/touch) into canvas-relative delta-x / delta-y percentages.
 *
 * The callback is called with updated (x, y) in document coordinates.
 * This hook does NOT mutate the document; the consumer decides how to apply
 * the new position (optimistic update, reducer dispatch, etc.).
 */
import { useCallback, useRef } from 'react';

export interface DragState {
  id: string;
  startClientX: number;
  startClientY: number;
  startX: number; // percent
  startY: number; // px
  scale: number;
  docWidth: number;
  /** x offset of stage relative to viewport (for clientX -> localX). */
  stageLeft: number;
  /** y offset of stage relative to viewport. */
  stageTop: number;
}

export interface DragHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
}

export function useDrag(opts: {
  stageRef: React.RefObject<HTMLElement>;
  scale: number;
  docWidth: number;
  onStart?: (id: string) => void;
  onMove?: (id: string, x: number, y: number, e: PointerEvent) => void;
  onEnd?: (id: string, x: number, y: number) => void;
  getInitial?: (id: string) => { x: number; y: number };
}) {
  const stateRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);

  const beginDrag = useCallback(
    (id: string, e: React.PointerEvent) => {
      const stage = opts.stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const initial = opts.getInitial ? opts.getInitial(id) : { x: 0, y: 0 };
      const state: DragState = {
        id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: initial.x,
        startY: initial.y,
        scale: opts.scale,
        docWidth: opts.docWidth,
        stageLeft: rect.left,
        stageTop: rect.top,
      };
      stateRef.current = state;
      opts.onStart?.(id);
      (e.target as Element).setPointerCapture?.(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!stateRef.current) return;
        if (rafRef.current != null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const s = stateRef.current;
          if (!s) return;
          const dxPx = (ev.clientX - s.startClientX) / s.scale;
          const dyPx = (ev.clientY - s.startClientY) / s.scale;
          // 1 percent == docWidth * scale px; we need px in stage local space.
          const stagePxPerPercent = (rect.width) / 100; // stage already scaled; rect is visual width
          const dxPercent = dxPx / stagePxPerPercent;
          let newX = s.startX + dxPercent;
          let newY = s.startY + dyPx;
          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(-200, newY);
          opts.onMove?.(s.id, newX, newY, ev);
        });
      };
      const onUp = (ev: PointerEvent) => {
        const s = stateRef.current;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (s) {
          const dxPx = (ev.clientX - s.startClientX) / s.scale;
          const dyPx = (ev.clientY - s.startClientY) / s.scale;
          const stagePxPerPercent = rect.width / 100;
          const dxPercent = dxPx / stagePxPerPercent;
          let newX = Math.max(0, Math.min(100, s.startX + dxPercent));
          let newY = Math.max(-200, s.startY + dyPx);
          opts.onEnd?.(s.id, newX, newY);
        }
        stateRef.current = null;
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [opts]
  );

  return { beginDrag };
}
