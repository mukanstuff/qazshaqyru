'use client';

import React from 'react';
import type { VideoBgElement } from '@/lib/canvas/types';

export function VideoBgElementView({ el }: { el: VideoBgElement }) {
  const src = el.src || '';
  const poster = el.posterSrc || undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000000',
      }}
    >
      {src ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
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
      )}
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
