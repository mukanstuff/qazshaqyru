/**
 * Shared pointer-capture + rAF-throttled move/end plumbing used by
 * useDrag/useResize/useRotate. Each of those hooks owns its own gesture
 * math (drag delta, resize-handle geometry, rotation angle) — this only
 * factors out the boilerplate they all repeated: capture the pointer,
 * throttle `pointermove` to one calculation per frame, and clean up
 * listeners on `pointerup`/`pointercancel`.
 */
import { useCallback, useRef } from 'react';

export function usePointerSession<S>() {
  const stateRef = useRef<S | null>(null);
  const rafRef = useRef<number | null>(null);

  const begin = useCallback(
    (
      e: React.PointerEvent,
      state: S,
      handlers: { onMove: (state: S, e: PointerEvent) => void; onEnd: (state: S, e: PointerEvent) => void }
    ) => {
      stateRef.current = state;

      // Suppress the browser's own drag/selection behaviour for the duration
      // of the gesture. Without this the pointer-down keeps its default
      // action, so dragging an element simultaneously moves it AND paints a
      // native blue text selection across the words under the cursor.
      e.preventDefault();
      const body = typeof document !== 'undefined' ? document.body : null;
      const previousUserSelect = body?.style.userSelect ?? '';
      if (body) body.style.userSelect = 'none';
      // Clear any selection the pointer-down managed to start before capture.
      window.getSelection?.()?.removeAllRanges();

      (e.target as Element).setPointerCapture?.(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!stateRef.current) return;
        if (rafRef.current != null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const s = stateRef.current;
          if (!s) return;
          handlers.onMove(s, ev);
        });
      };

      const onUp = (ev: PointerEvent) => {
        const s = stateRef.current;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (body) body.style.userSelect = previousUserSelect;
        if (s) handlers.onEnd(s, ev);
        stateRef.current = null;
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    []
  );

  return { begin };
}
