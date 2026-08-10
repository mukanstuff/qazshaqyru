import type { CSSProperties } from 'react';
import type { TextElement, HeadingElement } from '@/lib/canvas/types';
import { fontStack } from './fontStack';

// Re-export the canonical `fontStack` (and helpers) so other modules
// that import from './TextElementView' keep working. The actual
// implementation lives in ./fontStack.
export { fontStack, loadAndResolveFont, ensureGoogleFont } from './fontStack';

/**
 * Shared style for both text and heading elements. HeadingElementView
 * previously re-implemented this — keep them in sync by going through
 * one helper.
 */
function textStyleBase(el: TextElement | HeadingElement): CSSProperties {
  return {
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
}

export function textStyle(el: TextElement | HeadingElement): CSSProperties {
  return textStyleBase(el);
}

export function TextElementView({ el }: { el: TextElement }) {
  const style: CSSProperties = textStyleBase(el);
  return <p style={style}>{el.text}</p>;
}
