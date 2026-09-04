import type { CSSProperties } from 'react';
import type { CoupleNamesElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

/**
 * Split a name into per-letter spans for `animation.type = 'letters'`.
 *
 * The stagger index continues across both names and the connector, so the pair
 * assembles as one phrase left to right rather than as two words racing each
 * other. Spaces keep their width but are not animated — a lone animated space
 * reads as a stutter.
 */
function Letters({ text, from }: { text: string; from: number }) {
  let i = from;
  return (
    <>
      {Array.from(text).map((ch, idx) => {
        if (ch === ' ') return <span key={idx}>&nbsp;</span>;
        const index = i++;
        return (
          <span
            key={idx}
            className="canvas-letter"
            style={{ ['--letter-index' as string]: index }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
}

export function CoupleNamesElementView({ el }: { el: CoupleNamesElement }) {
  const perLetter = el.animation?.type === 'letters';
  const nameStyle: CSSProperties = {
    fontFamily: fontStack(el.font),
    fontSize: el.fontSize,
    color: el.color,
    textAlign: 'center',
    lineHeight: 1.1,
    margin: 0,
    fontStyle: el.italic ? 'italic' : undefined,
  };
  const connectorColor = el.connectorColor || el.color;
  return (
    <div
      style={{
        display: 'flex',
        // `stacked` forces one name per line. Relying on flex-wrap instead
        // made the break depend on the container width and the rendered
        // glyph widths, so the same names could sit on one line in one
        // template and two in another.
        flexDirection: el.stacked ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: el.stacked ? Math.round(el.fontSize * 0.12) : 16,
        flexWrap: el.stacked ? 'nowrap' : 'wrap',
      }}
    >
      <div style={nameStyle}>
        {perLetter ? <Letters text={el.first} from={0} /> : el.first}
      </div>
      <Connector connector={el.connector} color={connectorColor} size={el.fontSize * 0.8} />
      <div style={nameStyle}>
        {perLetter ? (
          // Continue the count past the first name plus the connector, so the
          // second name starts arriving only once the first has finished.
          <Letters text={el.second} from={el.first.replace(/ /g, '').length + 2} />
        ) : (
          el.second
        )}
      </div>
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
