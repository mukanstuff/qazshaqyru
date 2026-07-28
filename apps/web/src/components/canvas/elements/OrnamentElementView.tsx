'use client';

import React from 'react';
import type { OrnamentElement } from '@/lib/canvas/types';

export function OrnamentElementView({ el }: { el: OrnamentElement }) {
  const src = el.src || '/assets/decorations/oy-1.svg';
  const color = el.color || '#c9a961';

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
        }}
      />
    </div>
  );
}
