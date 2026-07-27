import type { CSSProperties } from 'react';
import type { HeadingElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

export function HeadingElementView({ el }: { el: HeadingElement }) {
  const Tag = el.as || 'h1';
  const style: CSSProperties = {
    fontFamily: fontStack(el.fontFamily),
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color: el.color,
    textAlign: el.textAlign,
    lineHeight: el.lineHeight,
    letterSpacing: `${el.letterSpacing}px`,
    fontStyle: el.italic ? 'italic' : undefined,
    textTransform: el.uppercase ? 'uppercase' : undefined,
    textShadow: el.textShadow
      ? `${el.textShadow.x}px ${el.textShadow.y}px ${el.textShadow.blur}px ${el.textShadow.color}`
      : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    padding: 0,
  };
  return <div style={style}>{el.text}</div>;
}
