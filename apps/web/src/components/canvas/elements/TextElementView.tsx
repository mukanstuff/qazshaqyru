import type { CSSProperties } from 'react';
import type { TextElement, HeadingElement } from '@/lib/canvas/types';
import { fontStack } from './fontStack';
import { Letters } from './Letters';

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
    textDecoration: el.underline ? 'underline' : undefined,
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

/**
 * Type set on a circle.
 *
 * The arc is described in the element's own design-space pixels, so the SVG's
 * user units are the same units `fontSize` is already written in and the type
 * needs no rescaling — the page's own transform then scales both together.
 *
 * `startOffset="50%"` with `text-anchor="middle"` centres the string on the
 * arc, which is what keeps a short name and a long one both balanced about
 * twelve o'clock instead of both starting there.
 */
export function CurvedTextView({
  el,
  boxWidth,
}: {
  el: TextElement | HeadingElement;
  boxWidth: number;
}) {
  const curve = el.curve!;
  const height = typeof el.h === 'number' ? el.h : boxWidth;
  const size = Math.min(boxWidth, height);
  const cx = boxWidth / 2;
  const cy = height / 2;
  // Pull the baseline in far enough that ascenders stay inside the box.
  const radius = (size / 2) * ((curve.radiusPct ?? 84) / 100);

  // A full circle cannot be drawn as one arc — its start and end coincide, and
  // the renderer draws nothing. Two half arcs, or a hair under 360.
  const sweep = Math.max(1, Math.min(curve.sweepDeg, 359.8));
  const flip = curve.flip === true;

  // Centred on twelve o'clock reading clockwise, or on six o'clock reading
  // counter-clockwise so the letters stay upright along the bottom.
  const centreDeg = flip ? 90 : -90;
  const from = centreDeg + (flip ? sweep / 2 : -sweep / 2);
  const to = centreDeg + (flip ? -sweep / 2 : sweep / 2);
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  const largeArc = sweep > 180 ? 1 : 0;
  const sweepFlag = flip ? 0 : 1;
  const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;

  const pathId = `qs-curve-${el.id}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${boxWidth} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden="false"
      role="img"
      aria-label={el.text}
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>
      <text
        fill={el.color}
        style={{
          fontFamily: fontStack(el.fontFamily),
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          fontStyle: el.italic ? 'italic' : undefined,
          letterSpacing: `${el.letterSpacing}px`,
          textTransform: el.uppercase ? 'uppercase' : undefined,
        }}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {el.text}
        </textPath>
      </text>
    </svg>
  );
}

export function TextElementView({ el, boxWidth }: { el: TextElement; boxWidth?: number }) {
  if (el.curve && boxWidth) return <CurvedTextView el={el} boxWidth={boxWidth} />;
  const style: CSSProperties = textStyleBase(el);
  // `letters` needs the text split into spans the stylesheet can stagger.
  // Without this the entrance resolves to a plain fade — see ./Letters.
  if (el.animation?.type === 'letters') {
    return (
      <p style={style}>
        <Letters text={el.text} />
      </p>
    );
  }
  return <p style={style}>{el.text}</p>;
}
