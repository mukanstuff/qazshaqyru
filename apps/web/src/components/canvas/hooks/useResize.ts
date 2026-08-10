/**
 * useResize — low-level pointer-based resize hook that calculates new width, height,
 * and position (when resizing from top/left handles) in document coordinates.
 *
 * Supports:
 * - Corner handles: 'nw', 'ne', 'sw', 'se'
 * - Side handles: 'n', 'e', 's', 'w'
 * - ShiftKey aspect-ratio preserving (corner handles only)
 */
import { useCallback, useRef } from 'react';

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w';

export interface ResizeState {
  id: string;
  handle: ResizeHandle;
  startClientX: number;
  startClientY: number;
  startX: number; // percent
  startY: number; // px
  startW: number; // percent
  startH: number | 'auto'; // px or auto
  scale: number;
  docWidth: number;
  stageWidthPx: number;
}

export function calculateResizeCoords(
  handle: ResizeHandle,
  initial: { x: number; y: number; w: number; h: number | 'auto' },
  dxPx: number,
  dyPx: number,
  stageWidthPx: number,
  scale: number,
  shiftKey: boolean
): { x: number; y: number; w: number; h: number | 'auto' } {
  const stagePxPerPercent = (stageWidthPx || 390) / 100;
  let dxPercent = dxPx / stagePxPerPercent;
  let dy = dyPx;

  // Shift key preserves aspect ratio for corner handles
  if (shiftKey && typeof initial.h === 'number' && initial.w > 0) {
    const ratio = initial.h / initial.w; // px per percent
    if (handle === 'se' || handle === 'nw') {
      dy = dxPercent * ratio;
    } else {
      dy = -dxPercent * ratio;
    }
  }

  let newX = initial.x;
  let newY = initial.y;
  let newW = initial.w;
  let newH = initial.h;

  // ── Corner handles ──────────────────────────────────────────────
  if (handle === 'nw') {
    newW = Math.max(5, initial.w - dxPercent);
    newX = initial.x + (initial.w - newW);
    if (typeof initial.h === 'number') {
      newH = Math.max(20, initial.h - dy);
      newY = initial.y + (initial.h - newH);
    }
  } else if (handle === 'ne') {
    newW = Math.max(5, initial.w + dxPercent);
    if (typeof initial.h === 'number') {
      newH = Math.max(20, initial.h - dy);
      newY = initial.y + (initial.h - newH);
    }
  } else if (handle === 'sw') {
    newW = Math.max(5, initial.w - dxPercent);
    newX = initial.x + (initial.w - newW);
    if (typeof initial.h === 'number') {
      newH = Math.max(20, initial.h + dy);
    }
  } else if (handle === 'se') {
    newW = Math.max(5, initial.w + dxPercent);
    if (typeof initial.h === 'number') {
      newH = Math.max(20, initial.h + dy);
    }
  }
  // ── Side handles ────────────────────────────────────────────────
  else if (handle === 'n') {
    if (typeof initial.h === 'number') {
      newH = Math.max(20, initial.h - dy);
      newY = initial.y + (initial.h - newH);
    }
  } else if (handle === 's') {
    if (typeof initial.h === 'number') {
      newH = Math.max(20, initial.h + dy);
    }
  } else if (handle === 'w') {
    newW = Math.max(5, initial.w - dxPercent);
    newX = initial.x + (initial.w - newW);
  } else if (handle === 'e') {
    newW = Math.max(5, initial.w + dxPercent);
  }

  newX = Math.max(0, Math.min(95, newX));
  newW = Math.min(100 - newX, newW);

  return { x: newX, y: newY, w: newW, h: newH };
}

export function useResize(opts: {
  stageRef: React.RefObject<HTMLElement>;
  scale: number;
  docWidth: number;
  onStart?: (id: string, handle: ResizeHandle) => void;
  onResize?: (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number | 'auto',
    e: PointerEvent
  ) => void;
  onEnd?: (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number | 'auto'
  ) => void;
  getInitial?: (id: string) => { x: number; y: number; w: number; h: number | 'auto' };
}) {
  const stateRef = useRef<ResizeState | null>(null);
  const rafRef = useRef<number | null>(null);

  const beginResize = useCallback(
    (id: string, handle: ResizeHandle, e: React.PointerEvent) => {
      const stage = opts.stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const initial = opts.getInitial
        ? opts.getInitial(id)
        : { x: 0, y: 0, w: 20, h: 40 };

      const state: ResizeState = {
        id,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: initial.x,
        startY: initial.y,
        startW: initial.w,
        startH: initial.h,
        scale: opts.scale || 1,
        docWidth: opts.docWidth || 390,
        stageWidthPx: rect.width || 390,
      };

      stateRef.current = state;
      opts.onStart?.(id, handle);
      (e.target as Element).setPointerCapture?.(e.pointerId);

      const computeCoords = (ev: PointerEvent) => {
        const s = stateRef.current;
        if (!s) return null;
        const dxPx = (ev.clientX - s.startClientX) / s.scale;
        const dyPx = (ev.clientY - s.startClientY) / s.scale;
        return calculateResizeCoords(
          s.handle,
          { x: s.startX, y: s.startY, w: s.startW, h: s.startH },
          dxPx,
          dyPx,
          s.stageWidthPx,
          s.scale,
          ev.shiftKey
        );
      };

      const onMove = (ev: PointerEvent) => {
        if (!stateRef.current) return;
        if (rafRef.current != null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const s = stateRef.current;
          if (!s) return;
          const coords = computeCoords(ev);
          if (coords) {
            opts.onResize?.(s.id, coords.x, coords.y, coords.w, coords.h, ev);
          }
        });
      };

      const onUp = (ev: PointerEvent) => {
        const s = stateRef.current;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        if (s) {
          const coords = computeCoords(ev);
          if (coords) {
            opts.onEnd?.(s.id, coords.x, coords.y, coords.w, coords.h);
          }
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

  return { beginResize };
}
