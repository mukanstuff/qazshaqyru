import type { CSSProperties } from 'react';
import type { HeadingElement } from '@/lib/canvas/types';
import { textStyle } from './TextElementView';

export function HeadingElementView({ el }: { el: HeadingElement }) {
  // Use the actual semantic tag. Default 'h1' per types.ts. This was
  // previously hard-coded to <div>, which broke SEO and screen-reader
  // navigation for guest pages. Fixed 2026-08-09.
  const Tag = (el.as || 'h1') as 'h1' | 'h2' | 'h3';
  const style: CSSProperties = textStyle(el);
  return <Tag style={style}>{el.text}</Tag>;
}
