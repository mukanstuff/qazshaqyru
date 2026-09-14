'use client';

import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ProgramElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

type Item = { time: string; title: string; description?: string; icon?: string };

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
 * The programme of the day, in several looks over the same data.
 *
 * The items, the inspector and the wizard are identical for every look; a
 * template chooses how the day is drawn. That is the point: the owner wants
 * each template to show its programme differently, and a programme that is a
 * separate hand-placed text block per template would lose the item editor.
 *
 *  - `list`: the original time-dot-title row, kept exactly as it was because
 *    stored documents use it. The owner called it ugly; no template should
 *    choose it.
 *  - `rail`: icon, thin rail with a mark, time over label («Жұпар»).
 *  - `stack`: centred. The time large in a script, the label small under it, a
 *    small mark between entries. The typography does the work, as on toi's
 *    wedding cards 29 and 31, where the time is Shelley at about 42px.
 *  - `zigzag`: entries alternate left and right of a dotted path, and an
 *    optional picture travels along the path as the guest scrolls.
 */
export function ProgramElementView({ el }: { el: ProgramElement }) {
  const items: Item[] = el.items && el.items.length > 0 ? el.items : [
    { time: '17:00', title: 'Сбор гостей', description: 'Фуршет и фотосессия' },
    { time: '18:00', title: 'Начало торжества', description: 'Церемония бракосочетания' },
    { time: '20:00', title: 'Праздничный банкет', description: 'Музыка, шоу и танцы' },
  ];

  const fontFamily = fontStack(el.fontFamily);
  const color = el.textColor || '#2c1810';
  const accentColor = el.accentColor || '#c9a961';

  if (el.variant === 'zigzag') return <ProgramZigzag el={el} items={items} />;

  if (el.variant === 'stack') {
    const size = el.fontSize ?? 17;
    const timeSize = el.timeSize ?? Math.round(size * 2.4);
    const markerSize = el.markerSize ?? 12;
    return (
      <div style={{ fontFamily, color, width: '100%', padding: '8px 12px', boxSizing: 'border-box', textAlign: 'center' }}>
        {el.title && (
          <div style={{ fontSize: size + 4, fontWeight: 600, marginBottom: 16 }}>{el.title}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: el.rowGap ?? 14 }}>
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 &&
                (isImageSrc(el.markerSrc) ? (
                  <div aria-hidden="true" style={tinted(el.markerSrc, markerSize, el.markerColor ?? accentColor)} />
                ) : (
                  <div aria-hidden="true" style={{ width: 28, height: 1, backgroundColor: el.lineColor ?? accentColor }} />
                ))}
              <div>
                <div
                  style={{
                    fontFamily: el.timeFontFamily ? fontStack(el.timeFontFamily) : fontFamily,
                    fontSize: timeSize,
                    lineHeight: 1.05,
                    color: el.timeColor || accentColor,
                  }}
                >
                  {item.time}
                </div>
                <div style={{ fontSize: size, lineHeight: 1.35, marginTop: 2 }}>{item.title}</div>
                {item.description && (
                  <div style={{ fontSize: Math.round(size * 0.85), opacity: 0.75, marginTop: 2, lineHeight: 1.3 }}>
                    {item.description}
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

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
                  <div style={{ width: markerSize, height: markerSize, borderRadius: '50%', backgroundColor: accentColor }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={
                    el.timeFontFamily
                      ? { fontFamily: fontStack(el.timeFontFamily), fontSize: el.timeSize ?? size * 2, lineHeight: 1.1, color: el.timeColor || accentColor }
                      : { fontSize: Math.round(size * 0.85), fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1.25, color: el.timeColor || accentColor }
                  }
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

/**
 * Entries left, right, left along a dotted path, with a picture flying it.
 *
 * Its own component because it measures itself and listens to scroll, and the
 * other looks must stay callable as plain functions (a test renders them
 * without React). The path is geometry — a thin dotted line, like a rail or a
 * border — and the traveller is whatever real artwork the template supplies;
 * nothing pictorial is drawn here.
 *
 * The traveller's position is the guest's scroll through the block: it sits on
 * the first mark while the block enters the screen and reaches the last as the
 * block leaves the upper part of it. Under reduced motion it stays on the
 * first mark.
 */
function ProgramZigzag({ el, items }: { el: ProgramElement; items: Item[] }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const travellerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  const size = el.fontSize ?? 17;
  const timeSize = el.timeSize ?? Math.round(size * 2.2);
  const rowH = el.rowHeight ?? 120;
  const markerSize = el.markerSize ?? 12;
  const travellerSize = el.travellerSize ?? 40;
  const color = el.textColor || '#2c1810';
  const accent = el.accentColor || '#c9a961';
  const lineColor = el.lineColor ?? accent;
  const height = items.length * rowH;

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const points = items.map((_, i) => ({ x: width * (i % 2 === 0 ? 0.2 : 0.8), y: rowH * (i + 0.5) }));
  const d = points.length
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const k = rowH * 0.6;
        return `${acc} C ${prev.x} ${prev.y + k}, ${p.x} ${p.y - k}, ${p.x} ${p.y}`;
      }, '')
    : '';

  useEffect(() => {
    if (!isImageSrc(el.travellerSrc) || !width) return;
    const box = boxRef.current;
    const path = pathRef.current;
    const traveller = travellerRef.current;
    if (!box || !path || !traveller) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const place = () => {
      frame = 0;
      const rect = box.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // 0 while the block's top is still in the lower sixth of the screen, 1 once
      // its foot has risen to 40% from the top — the flight spans the whole time
      // the programme is being read. The first mapping ended the flight as soon as
      // the block was fully on screen, so a guest reading it saw a parked picture.
      const progress = reduce ? 0 : Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / Math.max(1, rect.height + vh * 0.45)));
      const len = path.getTotalLength();
      const at = path.getPointAtLength(progress * len);
      const ahead = path.getPointAtLength(Math.min(len, progress * len + 2));
      const behind = path.getPointAtLength(Math.max(0, progress * len - 2));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      const turn = el.travellerRotate === false ? 0 : angle;
      traveller.style.transform = `translate(${at.x - travellerSize / 2}px, ${at.y - travellerSize / 2}px) rotate(${turn}deg)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    // Capture, so a scroll on any scrolling ancestor is heard, not only the window's.
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [el.travellerSrc, el.travellerRotate, width, travellerSize, d]);

  return (
    <div
      ref={boxRef}
      style={{ position: 'relative', width: '100%', height, fontFamily: fontStack(el.fontFamily), color }}
    >
      {width > 0 && (
        <svg aria-hidden="true" width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <path
            ref={pathRef}
            d={d}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.5}
            strokeDasharray="1 7"
            strokeLinecap="round"
          />
        </svg>
      )}
      {points.map((p, i) => (
        <div
          key={`m${i}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: p.x - markerSize / 2,
            top: p.y - markerSize / 2,
            ...(isImageSrc(el.markerSrc)
              ? tinted(el.markerSrc, markerSize, el.markerColor ?? accent)
              : { width: markerSize, height: markerSize, borderRadius: '50%', backgroundColor: el.markerColor ?? accent }),
          }}
        />
      ))}
      {items.map((item, i) => {
        const left = i % 2 === 0;
        return (
          <div
            key={`t${i}`}
            style={{
              position: 'absolute',
              top: rowH * (i + 0.5),
              transform: 'translateY(-50%)',
              ...(left ? { left: '32%', right: 0, textAlign: 'left' } : { left: 0, right: '32%', textAlign: 'right' }),
            }}
          >
            <div
              style={{
                fontFamily: el.timeFontFamily ? fontStack(el.timeFontFamily) : undefined,
                fontSize: timeSize,
                lineHeight: 1.05,
                color: el.timeColor || accent,
              }}
            >
              {item.time}
            </div>
            <div style={{ fontSize: size, lineHeight: 1.3, marginTop: 2 }}>{item.title}</div>
          </div>
        );
      })}
      {isImageSrc(el.travellerSrc) && width > 0 && (
        <div
          ref={travellerRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: travellerSize,
            height: travellerSize,
            backgroundImage: `url(${JSON.stringify(el.travellerSrc)})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            willChange: 'transform',
            transition: 'transform 120ms linear',
          }}
        />
      )}
    </div>
  );
}
