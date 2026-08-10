'use client';

import { getAssetUrl } from '@/lib/templates/helpers';
import type { TemplateManifest } from '@/lib/templates/manifest-types';

interface Props {
  manifest: TemplateManifest;
}

export function TemplateBackdrop({ manifest }: Props) {
  const url = (key: string) => {
    const file = manifest.assets[key];
    if (!file) return null;
    return getAssetUrl(manifest.slug, file);
  };

  const texture = url('bgTexture');
  const grain = url('overlayGrain');
  const vignette = url('overlayVignette');
  const glow = url('overlayGlow');
  const emblem = url('emblemPrimary');

  return (
    <div className="layer-canvas" aria-hidden>
      {texture ? (
        <div
          className="layer-canvas__texture"
          style={{ backgroundImage: `url(${texture})` }}
        />
      ) : null}
      {grain ? (
        <div
          className="layer-canvas__grain"
          style={{ backgroundImage: `url(${grain})`, opacity: 0.35 }}
        />
      ) : null}
      {vignette ? (
        <div
          className="layer-canvas__vignette"
          style={{ backgroundImage: `url(${vignette})`, opacity: 0.4 }}
        />
      ) : null}
      {glow ? (
        <div
          className="layer-canvas__glow"
          style={{ backgroundImage: `url(${glow})`, opacity: 0.55 }}
        />
      ) : null}
      {emblem ? (
        <div className="layer-canvas__emblem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={emblem} alt="" />
        </div>
      ) : null}
    </div>
  );
}
