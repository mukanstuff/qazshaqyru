import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { ImageElement } from '@/lib/canvas/types';

/**
 * Border-radius shorthand for each silhouette.
 *
 * `arch` uses a 50% radius on the two top corners, which resolves to a true
 * semicircular head at any width, and 0 at the foot. Expressing it through
 * border-radius rather than clip-path keeps the border, shadow and overlay
 * following the same outline for free.
 */
function maskRadius(el: ImageElement): string | number {
  switch (el.maskShape) {
    case 'arch':
      return '50% 50% 0 0 / 42% 42% 0 0';
    case 'circle':
      return '50%';
    case 'oval':
      return '50% / 50%';
    // 'oyu' is a real outline, not a radius — it goes through clip-path below.
    default:
      return el.borderRadius;
  }
}

/**
 * The `oyu` silhouette: a қошқар мүйіз (ram's-horn) cartouche.
 *
 * Every invitation service in this market cuts photographs into the same two
 * shapes, an arch or an oval. This is the outline of the ornament the culture
 * actually uses — a pointed head, shouldered sides that curl inward at the
 * waist, and a mirrored foot — so a photograph reads as set into Kazakh
 * ornament rather than into a generic frame. Expressed in percentages so it
 * holds its proportions at any size.
 */
export const OYU_CLIP_ID = 'qs-oyu-clip';

/**
 * Defined as an SVG clipPath in objectBoundingBox units rather than as a CSS
 * polygon(): the shape's character is entirely in its curves — a pointed crown,
 * flared shoulders, a pinched waist and a heavier foot — and a polygon of
 * straight segments rendered it as a soft blob. Bounding-box units keep the
 * proportions at any size. The defs block is emitted once by CanvasRenderer.
 */
export const OYU_CLIP_PATH =
  'M0.5 0 ' +
  'C0.60 0.008 0.665 0.055 0.695 0.135 ' +
  'C0.725 0.215 0.72 0.255 0.755 0.275 ' +
  'C0.83 0.315 0.925 0.335 0.945 0.415 ' +
  'C0.965 0.495 0.90 0.535 0.835 0.545 ' +
  'C0.90 0.60 0.955 0.665 0.935 0.755 ' +
  'C0.91 0.865 0.80 0.945 0.635 0.985 ' +
  'C0.575 0.998 0.535 1 0.5 1 ' +
  'C0.465 1 0.425 0.998 0.365 0.985 ' +
  'C0.20 0.945 0.09 0.865 0.065 0.755 ' +
  'C0.045 0.665 0.10 0.60 0.165 0.545 ' +
  'C0.10 0.535 0.035 0.495 0.055 0.415 ' +
  'C0.075 0.335 0.17 0.315 0.245 0.275 ' +
  'C0.28 0.255 0.275 0.215 0.305 0.135 ' +
  'C0.335 0.055 0.40 0.008 0.5 0 Z';

/**
 * Feathered edges as a mask, so what fades is opacity and not a colour painted
 * over the picture — the same illustration then sits on any ground.
 */
function fadeMask(el: ImageElement): string | undefined {
  const f = el.maskFade;
  if (!f) return undefined;
  const layers: string[] = [];
  if (f.top || f.bottom) {
    layers.push(
      `linear-gradient(to bottom, transparent 0%, #000 ${f.top ?? 0}%, #000 ${100 - (f.bottom ?? 0)}%, transparent 100%)`,
    );
  }
  if (f.left || f.right) {
    layers.push(
      `linear-gradient(to right, transparent 0%, #000 ${f.left ?? 0}%, #000 ${100 - (f.right ?? 0)}%, transparent 100%)`,
    );
  }
  return layers.length ? layers.join(', ') : undefined;
}

export function ImageElementView({ el }: { el: ImageElement }) {
  const grade = el.grade;
  const filter = grade
    ? [
        grade.saturate !== undefined ? `saturate(${grade.saturate}%)` : '',
        grade.brightness !== undefined ? `brightness(${grade.brightness}%)` : '',
        grade.contrast !== undefined ? `contrast(${grade.contrast}%)` : '',
        grade.sepia !== undefined ? `sepia(${grade.sepia}%)` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;

  const fade = fadeMask(el);
  const wrapStyle: CSSProperties = {
    width: '100%',
    height: typeof el.h === 'number' ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: maskRadius(el),
    clipPath: el.maskShape === 'oyu' ? 'url(#' + OYU_CLIP_ID + ')' : undefined,
    // Both masks intersect where both are present, so a feathered edge can be
    // combined with a silhouette.
    maskImage: fade,
    WebkitMaskImage: fade,
    maskComposite: fade && fade.includes(',') ? 'intersect' : undefined,
    WebkitMaskComposite: fade && fade.includes(',') ? 'source-in' : undefined,
    filter,
    border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || 'transparent'}` : undefined,
    boxShadow: el.shadow
      ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}`
      : undefined,
    aspectRatio: typeof el.h !== 'number' ? '16/9' : undefined,
  };

  const imgStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: el.objectFit,
    display: 'block',
  };

  const isRemote = /^https?:\/\//.test(el.src);
  const isSvg = el.src.endsWith('.svg');

  // Tinted artwork is painted, not loaded as a picture: the file supplies the
  // silhouette through `mask-image` and the colour comes from the theme. There
  // is no <img> at all in this branch, so `objectFit` has no meaning — the
  // equivalent knob is `mask-size`, and `contain` is right for an ornament,
  // which must never be cropped by its own box.
  if (el.tint) {
    return (
      <div
        style={{
          ...wrapStyle,
          backgroundColor: el.tint,
          maskImage: `url("${el.src}")`,
          WebkitMaskImage: `url("${el.src}")`,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: el.objectFit === 'cover' ? 'cover' : 'contain',
          WebkitMaskSize: el.objectFit === 'cover' ? 'cover' : 'contain',
          // `maskFade` already spent maskImage on a gradient; the two cannot
          // both own the property, and the silhouette is the one that matters.
          maskComposite: undefined,
          WebkitMaskComposite: undefined,
        }}
        role={el.alt ? 'img' : 'presentation'}
        aria-label={el.alt || undefined}
      />
    );
  }

  return (
    <div style={wrapStyle}>
      {el.overlayColor && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: el.overlayColor,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
      {el.overlayGradient && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${el.overlayGradient.angle ?? 180}deg, ${el.overlayGradient.from}, ${el.overlayGradient.to})`,
            // Above the picture, below anything the page stacks on top of the
            // element — the scrim must darken the photograph, never the type.
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}
      {isSvg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={el.src} alt={el.alt || ''} style={imgStyle} loading="lazy" />
      ) : (
        <Image
          src={el.src}
          alt={el.alt || ''}
          fill={typeof el.h === 'number'}
          width={typeof el.h !== 'number' ? 1200 : undefined}
          height={typeof el.h !== 'number' ? 675 : undefined}
          sizes="(max-width: 640px) 100vw, 800px"
          style={imgStyle}
          unoptimized={!isRemote}
        />
      )}
    </div>
  );
}
