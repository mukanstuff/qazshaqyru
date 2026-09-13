'use client';

import React, { useEffect, useRef } from 'react';
import type { VideoBgElement } from '@/lib/canvas/types';
import { fadeMask } from './ImageElementView';

/**
 * A clip used as artwork inside the canvas.
 *
 * Three things were wrong with the previous version and all three are the
 * same mistake — the schema described a capability the view did not
 * implement, so a document could set the property and nothing happened:
 *
 *  - `opacity` is declared in the schema with a default of 0.6 and was never
 *    applied, so every clip played at full strength and no template could put
 *    one behind type;
 *  - `loop` was hardcoded on, so a clip that resolves snapped back to its
 *    first frame forever;
 *  - the placeholder for an empty `src` was a black plate reading "Видео-фон",
 *    which is fine in the editor and is a black rectangle in the middle of a
 *    published invitation.
 *
 * `preload="metadata"` rather than `auto`: an invitation can carry several of
 * these and a guest arrives on mobile data.
 */
export function VideoBgElementView({
  el,
  mode = 'guest',
}: {
  el: VideoBgElement;
  mode?: 'editor' | 'guest';
}) {
  const src = el.src || '';
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /*
   * Keep the clip running.
   *
   * A muted autoplaying background video does not stay playing. Chrome pauses
   * it when the tab goes to the background and does not always resume; after
   * long enough it reclaims the decoder outright and the element comes back
   * with readyState 0, i.e. a still frame that never moves again. Reported on
   * this page after the tab had been left open for hours.
   *
   * So: play it while it is on screen, pause it while it is not (which is also
   * why a page with several clips does not melt a phone), and reload it if the
   * browser has thrown the data away.
   */
  useEffect(() => {
    const node = videoRef.current;
    if (!node || !src) return;

    let onScreen = true;

    const resume = () => {
      if (!onScreen || document.hidden) return;
      if (node.readyState === 0) node.load();
      if (node.paused) {
        const played = node.play();
        if (played && typeof played.catch === 'function') played.catch(() => {});
      }
    };

    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting;
              if (onScreen) resume();
              else if (!node.paused) node.pause();
            },
            { rootMargin: '120px' },
          )
        : null;
    observer?.observe(node);

    document.addEventListener('visibilitychange', resume);
    node.addEventListener('pause', resume);
    node.addEventListener('stalled', resume);
    node.addEventListener('suspend', resume);
    // Backstop for the cases none of the events above cover — a decoder
    // reclaimed silently leaves the element paused with no event at all.
    const beat = window.setInterval(resume, 5000);

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', resume);
      node.removeEventListener('pause', resume);
      node.removeEventListener('stalled', resume);
      node.removeEventListener('suspend', resume);
      window.clearInterval(beat);
    };
  }, [src]);

  if (!src) {
    // An empty slot needs a handle in the editor and must paint nothing at
    // all on a published page, where a black plate reading "Видео-фон" is
    // simply a black rectangle in the middle of somebody's invitation.
    if (mode !== 'editor') return null;
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 13,
          backgroundColor: '#1b1419',
        }}
      >
        ▶ Видео-фон
      </div>
    );
  }

  const fade = fadeMask(el);
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        maskImage: fade,
        WebkitMaskImage: fade,
        maskComposite: fade && fade.includes(',') ? 'intersect' : undefined,
        WebkitMaskComposite: fade && fade.includes(',') ? 'source-in' : undefined,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={el.posterSrc || undefined}
        autoPlay
        muted
        loop={el.loop !== false}
        playsInline
        preload="metadata"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: el.opacity ?? 1,
        }}
      />
      {el.overlayColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: el.overlayColor,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
