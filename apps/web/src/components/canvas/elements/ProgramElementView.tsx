'use client';

import React from 'react';
import type { ProgramElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

export function ProgramElementView({ el }: { el: ProgramElement }) {
  const items = el.items && el.items.length > 0 ? el.items : [
    { time: '17:00', title: 'Сбор гостей', description: 'Фуршет и фотосессия' },
    { time: '18:00', title: 'Начало торжества', description: 'Церемония бракосочетания' },
    { time: '20:00', title: 'Праздничный банкет', description: 'Музыка, шоу и танцы' },
  ];

  const fontFamily = fontStack(el.fontFamily);
  const color = el.textColor || '#2c1810';
  const accentColor = el.accentColor || '#c9a961';

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
                color: accentColor,
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
