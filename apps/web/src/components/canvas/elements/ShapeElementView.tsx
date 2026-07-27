import type { CSSProperties } from 'react';
import type { ShapeElement } from '@/lib/canvas/types';

export function ShapeElementView({ el }: { el: ShapeElement }) {
  const base: CSSProperties = {
    width: '100%',
    height: typeof el.h === 'number' ? '100%' : 40,
    background: el.fill || 'transparent',
    border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : 'none',
    opacity: el.opacity ?? 1,
    boxSizing: 'border-box',
  };
  if (el.shape === 'circle') {
    return <div style={{ ...base, borderRadius: '50%' }} />;
  }
  if (el.shape === 'line') {
    return (
      <div
        style={{
          ...base,
          height: el.strokeWidth || 2,
          background: el.stroke || el.fill || '#c9a961',
          border: 'none',
        }}
      />
    );
  }
  if (el.shape === 'star') {
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
        <polygon
          points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9"
          fill={el.fill || '#c9a961'}
          stroke={el.stroke || 'none'}
          strokeWidth={el.strokeWidth || 0}
        />
      </svg>
    );
  }
  if (el.shape === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: 'block' }}>
        <path
          d="M2 12h18M13 6l6 6-6 6"
          fill="none"
          stroke={el.stroke || el.fill || '#6b1d3a'}
          strokeWidth={el.strokeWidth || 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return <div style={base} />;
}
