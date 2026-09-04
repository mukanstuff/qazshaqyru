'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook. Returns `initial` until mounted client-side
 * (avoids a hydration mismatch on first paint), then tracks the query live.
 */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Matches the editor's desktop breakpoint (rail vs. sheet layouts). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
