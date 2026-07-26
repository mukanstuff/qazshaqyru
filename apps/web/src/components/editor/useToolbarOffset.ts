'use client';

import { useEffect, type RefObject } from 'react';

const CSS_VAR = '--kz-editor-toolbar-h';

/** Sync toolbar height to a CSS variable for scroll padding and panel offsets. */
export function useToolbarOffset(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    const sync = () => {
      document.documentElement.style.setProperty(CSS_VAR, `${el.offsetHeight}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener('resize', sync);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [ref]);
}
