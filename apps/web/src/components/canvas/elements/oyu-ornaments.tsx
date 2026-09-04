import type { ReactElement } from 'react';

/**
 * Built-in Kazakh ornament, drawn as inline SVG.
 *
 * The existing ornament element paints an external `.svg` file through a CSS
 * mask. That is fine for a static flourish and useless for motion: a mask has
 * no strokes, so it cannot be drawn on. These are authored as real geometry,
 * so `animation.type = 'draw'` can walk each stroke with `stroke-dashoffset`
 * and the ornament assembles itself as the guest scrolls past it.
 *
 * The vocabulary is қошқар мүйіз — the ram's-horn spiral. One curve, `HORN`,
 * generates the whole set: it sweeps out, turns up, and curls inward on a
 * decreasing radius (40 → 30 → 17 → 8), which is what keeps a curl reading as
 * a horn rather than as a snail. Everything is placed by transform from that
 * single path, so the family stays coherent the way a typeface does, and every
 * colour comes from `currentColor`.
 */
export type OyuOrnamentId =
  | 'oyu-band'
  | 'oyu-corner'
  | 'oyu-medallion'
  | 'oyu-thread'
  | 'oyu-crest';

const HAIRLINE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** The same outline at ribbon weight — a solid horn rather than a drawn one. */
const RIBBON = { ...HAIRLINE, strokeWidth: 9 };

const HORN =
  'M0 0 C 26 0 40 -13 40 -30 C 40 -45 30 -54 18 -54 ' +
  'C 8 -54 2 -47 2 -39 C 2 -32 8 -28 13 -29 C 18 -30 20 -35 17 -38';

/** Strokes animate in `--draw-index` order, so an ornament grows from its centre. */
function drawProps(index: number) {
  return {
    'data-draw': '',
    pathLength: 1,
    style: { ['--draw-index' as string]: index },
  } as const;
}

const Dot = ({ cx, cy, r = 2.8 }: { cx: number; cy: number; r?: number }) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
);

/**
 * Section divider. Reads centre-outward: a lozenge on the axis, a full horn
 * either side of it, a hairline run, a half-scale horn, then a terminal dot —
 * so the band closes on a shape instead of stopping in mid-air.
 */
function Band(): ReactElement {
  const half = (
    <>
      <g transform="translate(16 0)">
        <path d={HORN} {...drawProps(1)} />
      </g>
      <path d="M60 0 H 112" {...drawProps(2)} />
      <g transform="translate(112 0) scale(.55)">
        <path d={HORN} {...drawProps(3)} />
      </g>
      <path d="M146 0 H 190" {...drawProps(4)} />
      <Dot cx={196} cy={0} r={3.2} />
    </>
  );
  return (
    <svg viewBox="0 0 420 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g {...HAIRLINE} transform="translate(210 60)">
        <path d="M0 -18 L9 0 L0 18 L-9 0 Z" {...drawProps(0)} />
        {half}
        <g transform="scale(-1 1)">{half}</g>
      </g>
    </svg>
  );
}

/** Corner bracket: a double rule with one horn nestled in the elbow. */
function Corner(): ReactElement {
  return (
    <svg viewBox="0 0 150 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g {...HAIRLINE}>
        <path d="M8 132 L8 40 C 8 22 22 8 40 8 L132 8" {...drawProps(0)} />
        <path d="M19 132 L19 45 C 19 31 31 19 45 19 L132 19" {...drawProps(1)} />
        <g transform="translate(44 44) rotate(45) scale(.66)">
          <path d={HORN} {...drawProps(2)} />
        </g>
        <Dot cx={132} cy={13.5} r={2.6} />
        <Dot cx={13.5} cy={132} r={2.6} />
      </g>
    </svg>
  );
}

/**
 * Eight-horn rosette between two rules, with a dot on each diagonal. The one
 * piece of radial symmetry on the page — the equivalent of the seal these
 * designs traditionally carry, built from the same horn as everything else.
 */
function Medallion(): ReactElement {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const diagonals = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  return (
    <svg viewBox="0 0 220 220" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g {...HAIRLINE} transform="translate(110 110)">
        <circle r={96} {...drawProps(0)} />
        <circle r={88} {...drawProps(0)} />
        <circle r={26} {...drawProps(1)} />
        {angles.map((a, i) => (
          <g key={a} transform={`rotate(${a}) translate(30 0) scale(.58)`}>
            <path d={HORN} {...drawProps(2 + (i % 4))} />
          </g>
        ))}
        {diagonals.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <Dot cx={76} cy={0} r={2.4} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * The spine: a hairline running a section's full height with four horns
 * budding off it, alternating sides. A page of separate centred blocks has no
 * through-line; this is it. `preserveAspectRatio="none"` so it stretches to
 * whatever height it is given without the horns growing with it.
 */
function Thread(): ReactElement {
  return (
    <svg viewBox="0 0 60 400" width="100%" height="100%" preserveAspectRatio="none">
      <g {...HAIRLINE}>
        <path d="M30 14 L30 386" {...drawProps(0)} />
        {[70, 160, 250, 340].map((y, i) => (
          <g key={y} transform={`translate(30 ${y}) rotate(${i % 2 ? 90 : -90}) scale(.6)`}>
            <path d={HORN} {...drawProps(1 + (i % 3))} />
          </g>
        ))}
        <Dot cx={30} cy={10} />
        <Dot cx={30} cy={390} />
      </g>
    </svg>
  );
}

/**
 * The crest: two horns mirrored at ribbon weight — қошқар мүйіз proper. The
 * template's signature mark, and the one element meant to be read as a solid
 * shape rather than as a line. Deliberately not drawable; it is a stamp.
 */
function Crest(): ReactElement {
  const horn = (
    <g transform="translate(10 0) scale(1.5)">
      <path d={HORN} />
    </g>
  );
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g {...RIBBON} transform="translate(150 170)">
        {horn}
        <g transform="scale(-1 1)">{horn}</g>
      </g>
    </svg>
  );
}

const REGISTRY: Record<OyuOrnamentId, () => ReactElement> = {
  'oyu-band': Band,
  'oyu-corner': Corner,
  'oyu-medallion': Medallion,
  'oyu-thread': Thread,
  'oyu-crest': Crest,
};

export function isOyuOrnamentId(id: string): id is OyuOrnamentId {
  return id in REGISTRY;
}

export function renderOyuOrnament(id: OyuOrnamentId): ReactElement {
  return REGISTRY[id]();
}
