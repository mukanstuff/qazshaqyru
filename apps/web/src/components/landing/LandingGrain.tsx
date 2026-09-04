/**
 * Film-grain overlay for the landing page.
 *
 * This used to load `/assets/templates/luxe-gold/overlays/overlay-grain-01.webp`
 * — a file under a directory that no longer exists in `public/`. Every landing
 * view fired a 404 for it and the overlay never rendered, so the "grain" was
 * simply absent while still costing a failed request on first paint.
 *
 * Grain is noise; it does not need to be a downloaded bitmap. An inline SVG
 * feTurbulence tile renders identically, ships with the HTML, cannot 404, and
 * costs no network request at all.
 */
const GRAIN_TILE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
      '<filter id="n">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>' +
      '<feColorMatrix type="saturate" values="0"/>' +
      '</filter>' +
      '<rect width="256" height="256" filter="url(#n)"/>' +
      '</svg>'
  );

export function LandingGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.035] mix-blend-multiply"
      style={{
        backgroundImage: `url("${GRAIN_TILE}")`,
        backgroundSize: '256px 256px',
      }}
    />
  );
}
