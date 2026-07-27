import type { CSSProperties } from 'react';
import type { TextElement } from '@/lib/canvas/types';

export function TextElementView({ el }: { el: TextElement }) {
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
  return <p style={style}>{el.text}</p>;
}

export function fontStack(family: TextElement['fontFamily']): string {
  switch (family) {
    case 'Cormorant': return "'KZ Cormorant', 'Cormorant Garamond', Georgia, serif";
    case 'Marck': return "'KZ Marck', 'Marck Script', cursive";
    case 'Unbounded': return "'KZ Unbounded', 'Unbounded', sans-serif";
    case 'system': return "system-ui, -apple-system, sans-serif";
    case 'Montserrat':
    default: return "'KZ Montserrat', 'Montserrat', 'Inter', system-ui, sans-serif";
  }
}
