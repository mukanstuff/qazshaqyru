'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

import {
  landingAsset,
  landingAssetPlaceholder,
} from '@/lib/templates/landing-assets';

interface LandingImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  name: string;
  alt: string;
}

/**
 * Landing image with PNG → SVG fallback while HF assets generate.
 */
export function LandingImage({ name, alt, ...props }: LandingImageProps) {
  const [src, setSrc] = useState(landingAsset(name));

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={() => {
        if (!src.endsWith('.svg')) {
          setSrc(landingAssetPlaceholder(name));
        }
      }}
    />
  );
}
