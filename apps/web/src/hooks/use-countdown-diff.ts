'use client';

import { useEffect, useState } from 'react';

/** Milliseconds until eventDate; null until mounted (avoids SSR/client hydration mismatch). */
export function useCountdownDiff(eventDate: Date): number | null {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setDiff(Math.max(0, eventDate.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  return diff;
}
