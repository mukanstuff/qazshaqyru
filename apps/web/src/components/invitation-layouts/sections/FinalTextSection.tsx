'use client';

import { boundField, type SectionProps } from './types';

export function FinalTextSection({ ctx, bindings }: SectionProps) {
  const text = boundField(bindings, 'text', ctx.fields);
  const poster = ctx.assetUrl('heroPoster');

  if (!text) return null;

  return (
    <section className="inv-section inv-manifest-final" data-section="final-text">
      <div
        className="inv-manifest-final__bg"
        style={poster ? { backgroundImage: `url(${poster})` } : undefined}
      >
        <div className="inv-manifest-final__overlay" />
        <p className="inv-manifest-final__text">{text}</p>
      </div>
    </section>
  );
}
