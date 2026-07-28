'use client';

import { useEffect, useRef } from 'react';
import type { LottieElement } from '@/lib/canvas/types';

declare global {
  interface Window {
    lottie?: {
      loadAnimation: (params: {
        container: HTMLElement;
        renderer: string;
        loop: boolean;
        autoplay: boolean;
        path?: string;
        animationData?: unknown;
      }) => { destroy: () => void };
    };
  }
}

export function LottieElementView({ el }: { el: LottieElement }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const src = el.src || '';
  const loop = el.loop !== false;
  const autoplay = el.autoplay !== false;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !src) return;

    let anim: { destroy: () => void } | null = null;
    let alive = true;

    const init = () => {
      if (!alive || !window.lottie || !container) return;
      try {
        anim = window.lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop,
          autoplay,
          path: src,
        });
      } catch {
        /* ignore */
      }
    };

    if (window.lottie) {
      init();
    } else {
      const scriptId = 'lottie-web-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', init);
      return () => {
        alive = false;
        script?.removeEventListener('load', init);
        anim?.destroy();
      };
    }

    return () => {
      alive = false;
      anim?.destroy();
    };
  }, [src, loop, autoplay]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!src && (
        <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
          ✦ Lottie анимация
        </div>
      )}
    </div>
  );
}
