'use client';

import { useEffect, useState } from 'react';
import type { QrCodeElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';
import QRCode from 'qrcode';

interface Props {
  el: QrCodeElement;
  shareUrl?: string;
  mode?: 'editor' | 'guest';
}

export function QrCodeElementView({ el, shareUrl }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');

  const targetUrl = el.value || shareUrl || 'https://qazshaqyru.kz';
  const fgColor = el.fgColor || '#000000';
  const bgColor = el.bgColor || '#ffffff';

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [targetUrl, fgColor, bgColor]);

  const fontFamily = 'Montserrat, system-ui, sans-serif';

  return (
    <div
      style={{
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 12,
        borderRadius: 12,
        backgroundColor: bgColor,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {el.caption && (
        <div style={{ fontSize: 13, fontWeight: 700, color: fgColor, textAlign: 'center' }}>
          {el.caption}
        </div>
      )}
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="QR код приглашения"
          style={{ width: '100%', maxWidth: 180, height: 'auto', display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: 140,
            height: 140,
            backgroundColor: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#888',
          }}
        >
          QR…
        </div>
      )}
    </div>
  );
}
