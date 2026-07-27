import type { CSSProperties } from 'react';
import type { CoupleNamesElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

export function CoupleNamesElementView({ el }: { el: CoupleNamesElement }) {
  const nameStyle: CSSProperties = {
    fontFamily: fontStack(el.font),
    fontSize: el.fontSize,
    color: el.color,
    textAlign: 'center',
    lineHeight: 1.1,
    margin: 0,
  };
  const connectorColor = el.connectorColor || el.color;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={nameStyle}>{el.first}</div>
      <Connector connector={el.connector} color={connectorColor} size={el.fontSize * 0.8} />
      <div style={nameStyle}>{el.second}</div>
    </div>
  );
}

function Connector({ connector, color, size }: { connector: CoupleNamesElement['connector']; color: string; size: number }) {
  if (connector === 'heart') {
    return (
      <span style={{ color, fontSize: size, lineHeight: 1 }} aria-hidden>
        ❤
      </span>
    );
  }
  if (connector === 'ornament') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 2 C 14 8, 22 10, 12 22 C 2 10, 10 8, 12 2 Z"
          fill={color}
        />
      </svg>
    );
  }
  return <span style={{ fontFamily: 'serif', fontSize: size, color, fontStyle: 'italic' }}>{connector}</span>;
}
