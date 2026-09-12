/**
 * Per-letter spans for `animation.type = 'letters'`.
 *
 * The stylesheet has carried `.canvas-anim-letters .canvas-letter` all along,
 * but only `CoupleNamesElementView` ever produced those spans — and no
 * template uses the `couple-names` element. So the one entrance in the
 * vocabulary that was written for the couple's names could not be applied to
 * a name anywhere in the catalogue: setting it on a heading fell through to a
 * plain fade, silently. Same class of defect as the animations stylesheet that
 * was never imported.
 *
 * Spaces keep their width but are not animated — a lone animated space reads
 * as a stutter. Newlines are preserved so a two-line name still breaks.
 */
export function Letters({ text, from = 0 }: { text: string; from?: number }) {
  let index = from;
  return (
    <>
      {Array.from(text).map((ch, i) => {
        if (ch === '\n') return <br key={i} />;
        if (ch === ' ') return <span key={i}>&nbsp;</span>;
        const at = index++;
        return (
          <span key={i} className="canvas-letter" style={{ ['--letter-index' as string]: at }}>
            {ch}
          </span>
        );
      })}
    </>
  );
}

/** How many letters `Letters` would animate — for continuing a stagger. */
export function letterCount(text: string): number {
  return Array.from(text).filter((ch) => ch !== ' ' && ch !== '\n').length;
}
