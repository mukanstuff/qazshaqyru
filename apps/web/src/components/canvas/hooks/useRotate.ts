/**
 * useRotate — low-level pointer-based rotation hook that computes angle
 * in degrees (0-359) using Math.atan2 between element center and pointer.
 *
 * Supports shiftKey snapping to 15-degree increments.
 */
import { useCallback, useRef } from 'react';

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
  const stateRef = useRef<RotateState | null>(null);
  const rafRef = useRef<number | null>(null);

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

      stateRef.current = {
        id,
        centerX,
        centerY,
        initialRotation: initial.rotation || 0,
      };

      opts.onStart?.(id);
      (e.target as Element).setPointerCapture?.(e.pointerId);

      const computeAngle = (ev: PointerEvent) => {
        const s = stateRef.current;
        if (!s) return 0;
        return calculateRotationAngle(s.centerX, s.centerY, ev.clientX, ev.clientY, ev.shiftKey);
      };

      const onMove = (ev: PointerEvent) => {
        if (!stateRef.current) return;
        if (rafRef.current != null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const s = stateRef.current;
          if (!s) return;
          const deg = computeAngle(ev);
          opts.onRotate?.(s.id, deg, ev);
        });
      };

      const onUp = (ev: PointerEvent) => {
        const s = stateRef.current;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        if (s) {
          const deg = computeAngle(ev);
          opts.onEnd?.(s.id, deg);
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

  return { beginRotate };
}
