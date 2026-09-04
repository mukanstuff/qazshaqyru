'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const SPEED_PX_PER_FRAME: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 0.35,
  normal: 0.6,
  fast: 0.9,
};

/**
 * Slowly auto-scrolls the window on the guest page, matching the
 * "autoscroll" feature competitors ship. Cancels itself permanently the
 * moment the guest scrolls, touches, or wheels on their own — this is a
 * presentation nicety, not something that should fight a guest actually
 * reading the page. Also a no-op entirely under prefers-reduced-motion.
 */
export function useAutoScroll(enabled: boolean, speed: 'slow' | 'normal' | 'fast' = 'normal') {
  const prefersReducedMotion = useReducedMotion();
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!enabled || prefersReducedMotion) return;
    cancelledRef.current = false;

    const cancel = () => {
      cancelledRef.current = true;
    };
    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchstart', cancel, { passive: true, once: true });
    window.addEventListener('keydown', cancel, { once: true });

    let rafId: number;
    const step = () => {
      if (cancelledRef.current) return;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
      if (atBottom) return;
      window.scrollBy(0, SPEED_PX_PER_FRAME[speed]);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, [enabled, prefersReducedMotion, speed]);
}
