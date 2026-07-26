'use client';

import { boundField, type SectionProps } from './types';

const SLOT_KEYS = ['photo1', 'photo2', 'photo3', 'photo4'] as const;

export function GallerySection({ ctx, bindings }: SectionProps) {
  const isKz = ctx.invitation.language === 'kz';
  const photos = SLOT_KEYS.map((slot) => boundField(bindings, slot, ctx.fields)).filter(Boolean);

  if (photos.length === 0) return null;

  return (
    <section className="inv-section inv-manifest-gallery" data-section="gallery">
      <div className="inv-section__inner">
        <p className="inv-label">{isKz ? 'Фотогалерея' : 'Галерея'}</p>
        <div className="inv-manifest-gallery__grid">
          {photos.map((src, i) => (
            <div key={i} className="inv-manifest-gallery__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
