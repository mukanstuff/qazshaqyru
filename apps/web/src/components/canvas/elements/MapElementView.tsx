'use client';

import { useState } from 'react';
import type { MapElement } from '@/lib/canvas/types';
import { fontStack } from './fontStack';
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
  const ink = el.textColor || '#2c1810';
  const card = el.bgColor || '#ffffff';

  const fontFamily = el.fontFamily
    ? fontStack(el.fontFamily)
    : 'Montserrat, system-ui, sans-serif';
  const borderRadius = 12;

  return (
    <div
      style={{
        fontFamily,
        borderRadius,
        overflow: 'hidden',
        border: `1px solid color-mix(in srgb, ${accent} 15%, transparent)`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        backgroundColor: card,
        width: '100%',
        // Fill the declared element box instead of growing past it. The card is
        // header + map well + footer, and the well used to take el.h on its
        // own, so a 250px element painted a 354px card — 34px of it on top of
        // the next section's panel.
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: ink }}>
          {el.markerTitle || t.venueFallback}
        </div>
        {el.address && (
          <div style={{ fontSize: 12, color: ink, opacity: 0.66, marginTop: 2 }}>{el.address}</div>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, backgroundColor: `color-mix(in srgb, ${ink} 7%, ${card})` }}>
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
            <svg width="26" height="32" viewBox="0 0 24 30" aria-hidden style={{ display: 'block' }}>
              <path d="M12 0C5.9 0 1 4.9 1 11c0 7.8 9.6 18.2 10 18.6.3.3.7.3 1 0 .4-.4 10-10.8 10-18.6 0-6.1-4.9-11-10-11Z" fill={accent} />
              <circle cx="12" cy="11" r="4" fill={card} />
            </svg>
            <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>
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

      <div style={{ padding: 10, textAlign: 'center', backgroundColor: `color-mix(in srgb, ${ink} 4%, ${card})` }}>
        <a
          href={parsedUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: accent,
            color: card,
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
