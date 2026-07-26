'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  url: string;
  label?: string;
  size?: number;
}

export function QrCodePanel({ url, label, size = 160 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (!dataUrl) return null;

  return (
    <div >
      {label && (
        <p >
          {label}
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- QR is rendered as a data URL */}
      <img
        src={dataUrl}
        alt="QR"
        width={size}
        height={size}
        
      />
    </div>
  );
}
