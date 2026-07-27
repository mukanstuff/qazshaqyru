/**
 * Placeholder renderer for functional elements that aren't yet wired to the
 * backend in this iteration. Renders a styled label so the canvas still
 * renders without errors; the editor will still show the element at its
 * coordinates and the guest page renders a lightweight fallback until the
 * specific interactive component is attached.
 */
import type { CSSProperties } from 'react';
import type { CanvasElement } from '@/lib/canvas/types';
import type { RendererMode } from '../CanvasRenderer';

interface Props {
  el: CanvasElement;
  mode: RendererMode;
  shareUrl?: string;
}

const LABELS: Record<string, { ru: string; kz: string; icon: string }> = {
  'rsvp-form': { ru: 'Форма ответа', kz: 'Жауап беру', icon: '✉' },
  wishes: { ru: 'Пожелания', kz: 'Тілектер', icon: '💌' },
  program: { ru: 'Программа дня', kz: 'Күн бағдарламасы', icon: '🕐' },
  map: { ru: 'Карта', kz: 'Карта', icon: '📍' },
  music: { ru: 'Музыка', kz: 'Музыка', icon: '🎵' },
  gift: { ru: 'Подарок', kz: 'Сыйлық', icon: '🎁' },
  qr: { ru: 'QR-код', kz: 'QR-код', icon: '▦' },
  lottie: { ru: 'Анимация', kz: 'Анимация', icon: '✦' },
  'video-bg': { ru: 'Видео-фон', kz: 'Видео фон', icon: '▶' },
  ornament: { ru: 'Орнамент', kz: 'Ою-өрнек', icon: '❀' },
};

export function PlaceholderFunctionalView({ el, mode, shareUrl }: Props) {
  const info = LABELS[el.type] || { ru: el.type, kz: el.type, icon: '•' };
  const label = info.ru;

  if (el.type === 'qr' && shareUrl && mode === 'guest') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <QrSkeleton value={shareUrl} />
        {(el as { caption?: string }).caption && (
          <div style={{ fontSize: 12, color: '#6b1d3a', textAlign: 'center' }}>
            {(el as { caption?: string }).caption}
          </div>
        )}
      </div>
    );
  }

  const style: CSSProperties = {
    width: '100%',
    padding: 16,
    border: mode === 'editor' ? '1px dashed rgba(107,29,58,0.3)' : 'none',
    borderRadius: 12,
    background:
      mode === 'editor'
        ? 'repeating-linear-gradient(45deg, rgba(201,169,97,0.06), rgba(201,169,97,0.06) 8px, transparent 8px, transparent 16px)'
        : 'transparent',
    textAlign: 'center',
    color: '#6b1d3a',
    fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
  };
  return (
    <div style={style} data-placeholder={el.type}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{info.icon}</div>
      <div>{label}</div>
    </div>
  );
}

/** A very simple visual QR placeholder (real QR renders via qrcode lib later). */
function QrSkeleton({ value }: { value: string }) {
  // Pseudo-QR grid seeded from value — purely decorative, not scannable.
  const size = 21;
  const cells: boolean[] = [];
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h & 1) === 1);
  }
  const cellSize = 8;
  const px = size * cellSize;
  return (
    <div
      style={{
        width: px,
        height: px,
        background: 'white',
        padding: 8,
        borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.1)',
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
      }}
      aria-label="QR code"
    >
      {cells.map((b, i) => (
        <div key={i} style={{ background: b ? '#000' : '#fff', width: cellSize, height: cellSize }} />
      ))}
    </div>
  );
}
