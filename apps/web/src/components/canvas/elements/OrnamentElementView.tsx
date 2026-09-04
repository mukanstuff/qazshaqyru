'use client';

import React from 'react';
import type { OrnamentElement } from '@/lib/canvas/types';
import { isOyuOrnamentId, renderOyuOrnament } from './oyu-ornaments';

export function OrnamentElementView({ el }: { el: OrnamentElement }) {
  const src = el.src || '/assets/decorations/oy-1.svg';
  const color = el.color || '#c9a961';

  /*
   * `ornamentId` had been on this element from the start and was never read —
   * the view only ever painted `src` through a CSS mask. A mask has no strokes,
   * so an ornament could not be drawn on, and every flourish in every template
   * could only pop in as a flat silhouette. Built-in ids render as real inline
   * geometry, which is what `animation.type = 'draw'` walks.
   */
  if (el.ornamentId && isOyuOrnamentId(el.ornamentId)) {
    const scaleX = el.flipX ? -1 : 1;
    const scaleY = el.flipY ? -1 : 1;
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform:
            scaleX === 1 && scaleY === 1 ? undefined : `scale(${scaleX}, ${scaleY})`,
        }}
      >
        {renderOyuOrnament(el.ornamentId)}
      </div>
    );
  }

  // flipX/flipY have been part of OrnamentElement since it was introduced but
  // were never read here, so a mirrored pair — the usual way to place a sprig
  // on both sides of a frame — silently rendered as two identical copies.
  const scaleX = el.flipX ? -1 : 1;
  const scaleY = el.flipY ? -1 : 1;
  const mirror = scaleX === 1 && scaleY === 1 ? undefined : `scale(${scaleX}, ${scaleY})`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: color,
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          minHeight: 30,
          transform: mirror,
        }}
      />
    </div>
  );
}
