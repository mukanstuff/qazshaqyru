'use client';

import { useEffect, useRef, useState } from 'react';
import { EditableField } from '../EditableField';
import { boundField, type SectionProps } from './types';

export function HeroNamesSection({ ctx, bindings, sectionProps }: SectionProps) {
  const groomName = boundField(bindings, 'groomName', ctx.fields);
  const brideName = boundField(bindings, 'brideName', ctx.fields);
  const isKz = ctx.invitation.language === 'kz';
  const headline = isKz ? 'ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ' : 'ПРИГЛАШЕНИЕ НА СВАДЬБУ';
  const heroCover = ctx.assetUrl('bgCover');
  const heroPoster = ctx.assetUrl('heroPoster');
  const dividerSrc = ctx.assetUrl('divider');
  const useVideo = sectionProps?.useVideo === true && ctx.manifest.heroVideo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(false);

  const videoUrl = useVideo
    ? `/assets/templates/${ctx.manifest.slug}/${ctx.manifest.heroVideo!.webm}`
    : null;
  const poster = heroPoster ?? heroCover;

  const groomBinding = bindings?.groomName ?? 'groomName';
  const brideBinding = bindings?.brideName ?? 'brideName';

  useEffect(() => {
    if (!useVideo || !videoRef.current) return;
    const v = videoRef.current;
    const tryPlay = () => {
      v.play().catch(() => setVideoOk(false));
    };
    v.addEventListener('canplay', tryPlay);
    return () => v.removeEventListener('canplay', tryPlay);
  }, [useVideo]);

  const renderName = (value: string, fieldKey: string, className: string) => {
    if (ctx.isEditing && ctx.onFieldSave) {
      return (
        <EditableField
          value={value}
          field={`customText.${fieldKey}`}
          onSave={ctx.onFieldSave}
          as="h1"
          className={className}
        />
      );
    }
    return <h1 className={className}>{value}</h1>;
  };

  return (
    <section className="inv-hero inv-manifest-hero" data-section="hero-names">
      {useVideo && videoUrl ? (
        <div className="inv-manifest-hero__media">
          <video
            ref={videoRef}
            className="inv-manifest-hero__video"
            autoPlay
            muted
            loop
            playsInline
            poster={poster ?? undefined}
            onError={() => setVideoOk(false)}
            onLoadedData={() => setVideoOk(true)}
          >
            <source src={videoUrl} type="video/webm" />
          </video>
          {!videoOk && poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="inv-manifest-hero__poster-fallback" />
          ) : null}
          <div className="inv-manifest-hero__gradient" />
        </div>
      ) : heroCover ? (
        <div className="layer-canvas__cover inv-manifest-hero__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroCover} alt="" />
          <div className="layer-canvas__overlay" />
        </div>
      ) : null}
      <div className="inv-hero__content inv-manifest-hero__content">
        <p className="inv-manifest-hero__headline">{headline}</p>
        {dividerSrc ? (
          <div className="inv-manifest-hero__divider">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dividerSrc} alt="" />
          </div>
        ) : null}
        <div className="inv-manifest-hero__names">
          {groomName ? renderName(groomName, groomBinding, 'inv-manifest-hero__name') : null}
          {groomName && brideName ? (
            <span className="inv-manifest-hero__amp" aria-hidden>
              &
            </span>
          ) : null}
          {brideName ? renderName(brideName, brideBinding, 'inv-manifest-hero__name') : null}
        </div>
        {(groomName || brideName) && (
          <div className="inv-manifest-hero__names inv-manifest-hero__names--repeat">
            {groomName ? <p>{groomName}</p> : null}
            {groomName && brideName ? <span aria-hidden>♥</span> : null}
            {brideName ? <p>{brideName}</p> : null}
          </div>
        )}
      </div>
      <div className="inv-hero__scroll" aria-hidden>
        <span>↓</span>
      </div>
    </section>
  );
}
