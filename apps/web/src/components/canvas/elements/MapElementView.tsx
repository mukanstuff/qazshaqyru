'use client';

import { useState } from 'react';
import type { MapElement } from '@/lib/canvas/types';
import { canEmbedMap, to2GisEmbedUrl, parseMapUrl } from '@/lib/shared/map-url';

interface Props {
  el: MapElement;
  locale?: 'ru' | 'kz';
}

const LABELS = {
  ru: {
    venueFallback: 'Место проведения',
    addressFallback: 'Адрес на карте',
    showInteractive: 'Показать интерактивную карту',
    openButton: 'Открыть в 2GIS / Картах →',
    iframeTitle: 'Карта проезда',
  },
  kz: {
    venueFallback: 'Өткізу орны',
    addressFallback: 'Картадағы мекенжай',
    showInteractive: 'Интерактивті картаны көрсету',
    openButton: '2GIS / Карталарда ашу →',
    iframeTitle: 'Жол картасы',
  },
};

export function MapElementView({ el, locale = 'ru' }: Props) {
  const [interactive, setInteractive] = useState(false);
  const t = LABELS[locale];

  const rawUrl = el.address || '';
  const parsedUrl = parseMapUrl(rawUrl) || 'https://2gis.kz';
  const embeddable = canEmbedMap(rawUrl);
  const embedUrl = to2GisEmbedUrl(rawUrl);
  const accent = el.accentColor || '#6b1d3a';

  const fontFamily = 'Montserrat, system-ui, sans-serif';
  const borderRadius = 12;

  return (
    <div
      style={{
        fontFamily,
        borderRadius,
        overflow: 'hidden',
        border: `1px solid color-mix(in srgb, ${accent} 15%, transparent)`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        backgroundColor: '#ffffff',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#2c1810' }}>
          {el.markerTitle || t.venueFallback}
        </div>
        {el.address && (
          <div style={{ fontSize: 12, color: '#6b5a52', marginTop: 2 }}>{el.address}</div>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', height: typeof el.h === 'number' ? el.h : 220, backgroundColor: '#f2ece9' }}>
        {embeddable && embedUrl && (interactive || !el.showStaticOnly) ? (
          <iframe
            src={embedUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={t.iframeTitle}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: 32 }}>📍</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2c1810' }}>
              {el.address || t.addressFallback}
            </div>
            {embeddable && embedUrl && (
              <button
                type="button"
                onClick={() => setInteractive(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${accent}`,
                  backgroundColor: 'transparent',
                  color: accent,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.showInteractive}
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: 10, textAlign: 'center', backgroundColor: '#faf6f3' }}>
        <a
          href={parsedUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: accent,
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {el.buttonLabel || t.openButton}
        </a>
      </div>
    </div>
  );
}
