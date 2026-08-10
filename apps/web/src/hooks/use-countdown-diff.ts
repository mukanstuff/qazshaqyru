'use client';

import { useEffect, useState } from 'react';

/** Milliseconds until eventDate; null until mounted (avoids SSR/client hydration mismatch). */
export function useCountdownDiff(eventDate: Date): number | null {
  const [diff, setDiff] = useState<number | null>(null);
  // Compare by timestamp number, not by Date identity — otherwise a fresh
  // `new Date(...)` object created on each render retriggers this effect on
  // every render, re-registering the interval and driving an update storm.
  const targetMs = eventDate.getTime();

  useEffect(() => {
    const tick = () => setDiff(Math.max(0, targetMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return diff;
}
