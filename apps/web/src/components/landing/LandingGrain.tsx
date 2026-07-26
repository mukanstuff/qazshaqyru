import { LANDING_TEXTURE_GRAIN } from '@/lib/landing/assets';

export function LandingGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.035] mix-blend-multiply"
      style={{
        backgroundImage: `url(${LANDING_TEXTURE_GRAIN})`,
        backgroundSize: '256px 256px',
      }}
    />
  );
}
