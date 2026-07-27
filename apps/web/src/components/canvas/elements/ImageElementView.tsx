import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { ImageElement } from '@/lib/canvas/types';

export function ImageElementView({ el }: { el: ImageElement }) {
  const wrapStyle: CSSProperties = {
    width: '100%',
    height: typeof el.h === 'number' ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: el.borderRadius,
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
