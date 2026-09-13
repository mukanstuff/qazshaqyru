'use client';

import React, { type CSSProperties } from 'react';
import type { ProgramElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

/** A path or an absolute URL; anything else (an emoji, a name) is not an image. */
const isImageSrc = (s?: string): s is string => !!s && (s.startsWith('/') || /^https?:\/\//.test(s));

/** Artwork painted in a colour through its own alpha, as tinted ornaments are. */
function tinted(src: string, size: number, color: string): CSSProperties {
  const url = `url(${JSON.stringify(src)})`;
  return {
    width: size,
    height: size,
    flexShrink: 0,
    backgroundColor: color,
    maskImage: url,
    WebkitMaskImage: url,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
  };
}

/**
 * The programme of the day.
 *
 * Two layouts. `list` is the original — time, dot, title — kept exactly as it
 * was, because documents already use it.
 *
 * `rail` is the one the reference set actually ships. toi's newest wedding
 * cards (templates 29-31) lay each row out as an illustration, a thin rail with
 * a small mark on it, and the time over the label. The element stored an
 * `icon` per item from the start and never drew it, and every size was fixed
 * at 12-14px; both are real now in this layout.
 */
export function ProgramElementView({ el }: { el: ProgramElement }) {
  const items: Array<{ time: string; title: string; description?: string; icon?: string }> =
    el.items && el.items.length > 0 ? el.items : [
    { time: '17:00', title: 'Сбор гостей', description: 'Фуршет и фотосессия' },
    { time: '18:00', title: 'Начало торжества', description: 'Церемония бракосочетания' },
    { time: '20:00', title: 'Праздничный банкет', description: 'Музыка, шоу и танцы' },
  ];

  const fontFamily = fontStack(el.fontFamily);
  const color = el.textColor || '#2c1810';
  const accentColor = el.accentColor || '#c9a961';

  if (el.variant === 'rail') {
    const size = el.fontSize ?? 16;
    const iconSize = el.iconSize ?? 0;
    const iconColor = el.iconColor ?? accentColor;
    const markerSize = el.markerSize ?? 10;
    const railWidth = Math.max(24, markerSize + 12);
    const gap = 14;
    const railLeft = 12 + (iconSize > 0 ? iconSize + gap : 0) + railWidth / 2;

    return (
      <div style={{ fontFamily, color, width: '100%', padding: 12, boxSizing: 'border-box' }}>
        {el.title && (
          <div style={{ fontSize: size + 4, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
            {el.title}
          </div>
        )}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: el.rowGap ?? 18 }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: railLeft - 12 - 0.5,
              top: iconSize > 0 ? iconSize / 2 : size,
              bottom: iconSize > 0 ? iconSize / 2 : size,
              width: 1,
              backgroundColor: el.lineColor ?? accentColor,
              opacity: el.lineColor ? 1 : 0.4,
            }}
          />
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap, position: 'relative' }}>
              {iconSize > 0 ? (
                isImageSrc(item.icon) ? (
                  <div aria-hidden="true" style={tinted(item.icon, iconSize, iconColor)} />
                ) : (
                  <div style={{ width: iconSize, flexShrink: 0 }} />
                )
              ) : null}
              <div style={{ width: railWidth, flexShrink: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                {isImageSrc(el.markerSrc) ? (
                  <div aria-hidden="true" style={tinted(el.markerSrc, markerSize, el.markerColor ?? accentColor)} />
                ) : (
                  <div
                    style={{
                      width: markerSize,
                      height: markerSize,
                      borderRadius: '50%',
                      backgroundColor: accentColor,
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: Math.round(size * 0.85),
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    lineHeight: 1.25,
                    color: el.timeColor || accentColor,
                  }}
                >
                  {item.time}
                </div>
                <div style={{ fontSize: size, fontWeight: 500, lineHeight: 1.3 }}>{item.title}</div>
                {item.description && (
                  <div style={{ fontSize: Math.round(size * 0.85), opacity: 0.75, marginTop: 2, lineHeight: 1.3 }}>
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily,
        color,
        width: '100%',
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      {el.title && (
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
          {el.title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 56,
            top: 10,
            bottom: 10,
            width: 2,
            backgroundColor: accentColor,
            opacity: 0.4,
          }}
        />
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 48,
                flexShrink: 0,
                textAlign: 'right',
                fontSize: 14,
                fontWeight: 700,
                // Four templates set `timeColor` on this element and this view
                // ignored it, so the hour always came out in the accent even
                // where the design had chosen a separate ink for it.
                color: el.timeColor || accentColor,
              }}
            >
              {item.time}
            </div>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: accentColor,
                border: '2px solid #ffffff',
                boxShadow: '0 0 0 2px rgba(201,169,97,0.3)',
                marginTop: 4,
                zIndex: 2,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{item.title}</div>
              {item.description && (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, lineHeight: 1.3 }}>
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
