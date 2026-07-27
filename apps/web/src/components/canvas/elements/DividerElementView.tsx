import type { CSSProperties } from 'react';
import type { DividerElement } from '@/lib/canvas/types';

export function DividerElementView({ el }: { el: DividerElement }) {
  const style: CSSProperties = {
    width: '100%',
    height: el.thickness,
    background: el.style === 'ornament' ? 'transparent' : el.color,
    borderStyle: el.style === 'solid' || el.style === 'ornament' ? 'none' : el.style,
    borderTopWidth: el.style !== 'solid' && el.style !== 'ornament' ? el.thickness : 0,
    borderTopColor: el.color,
    position: 'relative',
  };
  if (el.style === 'ornament') {
    return (
      <div style={style} aria-hidden>
        <svg
          viewBox="0 0 200 20"
          width="100%"
          height={Math.max(20, el.thickness * 4)}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M0 10 Q 50 0 100 10 T 200 10"
            stroke={el.color}
            strokeWidth={el.thickness}
            fill="none"
          />
          <circle cx="100" cy="10" r={el.thickness * 2} fill={el.color} />
        </svg>
      </div>
    );
  }
  return <div style={style} />;
}
