/**
 * useRotate — low-level pointer-based rotation hook that computes angle
 * in degrees (0-359) using Math.atan2 between element center and pointer.
 *
 * Supports shiftKey snapping to 15-degree increments.
 */
import { useCallback } from 'react';
import { usePointerSession } from './usePointerSession';

export interface RotateState {
  id: string;
  centerX: number;
  centerY: number;
  initialRotation: number;
}

export function calculateRotationAngle(
  centerX: number,
  centerY: number,
  clientX: number,
  clientY: number,
  shiftKey: boolean
): number {
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const rad = Math.atan2(dy, dx);
  let deg = rad * (180 / Math.PI) + 90; // 0 degrees is 12 o'clock
  if (deg < 0) deg += 360;
  deg = Math.round(deg) % 360;

  if (shiftKey) {
    deg = Math.round(deg / 15) * 15 % 360;
  }

  return deg;
}

export function useRotate(opts: {
  stageRef: React.RefObject<HTMLElement>;
  onStart?: (id: string) => void;
  onRotate?: (id: string, angleDeg: number, e: PointerEvent) => void;
  onEnd?: (id: string, angleDeg: number) => void;
  getInitial?: (id: string) => { rotation: number };
}) {
  const session = usePointerSession<RotateState>();

  const beginRotate = useCallback(
    (id: string, e: React.PointerEvent) => {
      const stage = opts.stageRef.current;
      if (!stage) return;

      const elNode = stage.querySelector(`[data-selected-id="${id}"]`);
      if (!elNode) return;

      const rect = elNode.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const initial = opts.getInitial ? opts.getInitial(id) : { rotation: 0 };

      const state: RotateState = {
        id,
        centerX,
        centerY,
        initialRotation: initial.rotation || 0,
      };

      opts.onStart?.(id);

      const computeAngle = (s: RotateState, ev: PointerEvent) =>
        calculateRotationAngle(s.centerX, s.centerY, ev.clientX, ev.clientY, ev.shiftKey);

      session.begin(e, state, {
        onMove: (s, ev) => {
          opts.onRotate?.(s.id, computeAngle(s, ev), ev);
        },
        onEnd: (s, ev) => {
          opts.onEnd?.(s.id, computeAngle(s, ev));
        },
      });
    },
    [opts, session]
  );

  return { beginRotate };
}
