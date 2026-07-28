'use client';

import { useEffect, useRef, useState } from 'react';
import type { MusicPlayerElement } from '@/lib/canvas/types';
import { CURATED_MUSIC_URLS } from '@/lib/uploads/media-url';

export function MusicPlayerElementView({ el }: { el: MusicPlayerElement }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const src = el.audioSrc || [...CURATED_MUSIC_URLS][0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.muted = muted;
    if (el.autoPlayMuted) {
      const handleFirstGesture = () => {
        audio.play().then(() => setPlaying(true)).catch(() => {});
        window.removeEventListener('click', handleFirstGesture);
        window.removeEventListener('touchstart', handleFirstGesture);
      };
      window.addEventListener('click', handleFirstGesture);
      window.addEventListener('touchstart', handleFirstGesture);
      return () => {
        window.removeEventListener('click', handleFirstGesture);
        window.removeEventListener('touchstart', handleFirstGesture);
      };
    }
  }, [el.autoPlayMuted, muted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
  };

  const bgColor = el.accentColor || '#6b1d3a';
  const textColor = '#ffffff';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 24,
        backgroundColor: bgColor,
        color: textColor,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <audio ref={audioRef} src={src} preload="none" />
      <button
        type="button"
        onClick={togglePlay}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
        }}
        title={playing ? 'Пауза' : 'Воспроизведение'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <span>{el.title || 'Музыка'}</span>
      <button
        type="button"
        onClick={toggleMute}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 14,
          opacity: 0.8,
        }}
        title={muted ? 'Включить звук' : 'Без звука'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
