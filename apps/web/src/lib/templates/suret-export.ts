/**
 * Compose Suret invitation to PNG/WebP via canvas (client-side).
 * Designer owns background quality; this only paints text slots.
 */

import type { SuretTemplateManifest } from '@/lib/templates/manifest-types';

export type SuretSlotValues = Record<string, string>;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderSuretToBlob(
  manifest: SuretTemplateManifest,
  slots: SuretSlotValues,
  locale: 'ru' | 'kz',
  type: 'image/png' | 'image/webp' = 'image/png',
  quality = 0.92,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = manifest.width;
  canvas.height = manifest.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = await loadImage(manifest.background);
  if (bg) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#f7f1e8');
    grad.addColorStop(1, '#e8dcc8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  for (const slot of manifest.texts) {
    const text =
      slots[slot.id]?.trim() ||
      (locale === 'kz' ? slot.defaultText.kk : slot.defaultText.ru);
    const fontSize = slot.fontSize ?? 24;
    ctx.fillStyle = slot.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px Georgia, "Times New Roman", serif`;
    const y = (slot.top / 100) * canvas.height;
    ctx.fillText(text, canvas.width / 2, y, canvas.width * 0.86);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Export failed'));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
