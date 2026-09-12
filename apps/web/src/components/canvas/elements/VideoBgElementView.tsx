'use client';

import React from 'react';
import type { VideoBgElement } from '@/lib/canvas/types';

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

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <video
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
