/**
 * useDrag — low-level pointer-based drag hook that maps pointer events
 * (mouse/touch) into canvas-relative delta-x / delta-y percentages.
 *
 * The callback is called with updated (x, y) in document coordinates.
 * This hook does NOT mutate the document; the consumer decides how to apply
 * the new position (optimistic update, reducer dispatch, etc.).
 */
import { useCallback } from 'react';
import { usePointerSession } from './usePointerSession';

export interface DragState {
  id: string;
  startClientX: number;
  startClientY: number;
  startX: number; // percent
  startY: number; // px
  /** Element width in percent — needed to clamp both edges, not just the left. */
  widthPercent: number;
  scale: number;
  docWidth: number;
  stageWidthPx: number;
}

/** How much of an element must stay on the page, in percent of page width. */
const MIN_VISIBLE_PERCENT = 8;

export interface DragHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
}

function computeDragCoords(s: DragState, ev: PointerEvent) {
  const dxPx = (ev.clientX - s.startClientX) / s.scale;
  const dyPx = (ev.clientY - s.startClientY) / s.scale;
  const stagePxPerPercent = s.stageWidthPx / 100;
  const dxPercent = dxPx / stagePxPerPercent;
  // `x` is the element's LEFT edge, so clamping it to 0..100 was asymmetric:
  // an element could be pushed until only its left edge touched the right
  // margin (its whole width hanging off the page), but never even one pixel
  // past the left edge. Dragging felt broken in one direction only.
  //
  // Clamp both edges instead, leaving a fixed sliver on the page either way —
  // which also makes deliberate full-bleed placement possible from the editor,
  // matching what the schema now allows.
  const w = s.widthPercent > 0 ? s.widthPercent : 0;
  const minX = MIN_VISIBLE_PERCENT - w;
  const maxX = 100 - MIN_VISIBLE_PERCENT;
  const newX = Math.max(minX, Math.min(maxX, s.startX + dxPercent));
  const newY = Math.max(-200, s.startY + dyPx);
  return { x: newX, y: newY };
}

export function useDrag(opts: {
  stageRef: React.RefObject<HTMLElement>;
  scale: number;
  docWidth: number;
  onStart?: (id: string) => void;
  onMove?: (id: string, x: number, y: number, e: PointerEvent) => void;
  onEnd?: (id: string, x: number, y: number) => void;
  getInitial?: (id: string) => { x: number; y: number; w?: number };
}) {
  const session = usePointerSession<DragState>();

  const beginDrag = useCallback(
    (id: string, e: React.PointerEvent) => {
      const stage = opts.stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const initial = opts.getInitial ? opts.getInitial(id) : { x: 0, y: 0, w: 0 };
      const state: DragState = {
        id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: initial.x,
        startY: initial.y,
        widthPercent: initial.w ?? 0,
        scale: opts.scale,
        docWidth: opts.docWidth,
        stageWidthPx: rect.width,
      };
      opts.onStart?.(id);
      session.begin(e, state, {
        onMove: (s, ev) => {
          const { x, y } = computeDragCoords(s, ev);
          opts.onMove?.(s.id, x, y, ev);
        },
        onEnd: (s, ev) => {
          const { x, y } = computeDragCoords(s, ev);
          opts.onEnd?.(s.id, x, y);
        },
      });
    },
    [opts, session]
  );

  return { beginDrag };
}
