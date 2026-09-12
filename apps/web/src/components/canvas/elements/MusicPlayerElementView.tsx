'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { MusicPlayerElement } from '@/lib/canvas/types';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { CURATED_MUSIC_URLS } from '@/lib/uploads/media-url';

export function MusicPlayerElementView({
  el,
  locale = 'ru',
}: {
  el: MusicPlayerElement;
  locale?: 'ru' | 'kz';
}) {
  const isKz = locale === 'kz';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const src = el.audioSrc || [...CURATED_MUSIC_URLS][0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // `loop` is declared on the <audio> element itself now.
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

  /*
   * The accent colour is the template's gold, and filling a permanent pinned
   * pill with it put a saturated brand-coloured button over every screen of the
   * invitation — the one element on the page that looked like an app. It reads
   * as chrome now: the accent is the outline and the label, the fill is a dark
   * translucent plate that takes the colour of whatever is behind it.
   */
  const accent = el.accentColor || '#6b1d3a';
  const textColor = accent;
  const ringId = useId().replace(/:/g, '');

  /*
   * The dial.
   *
   * A pill labelled "Әуен" is a web control; every invitation in this market
   * floats a round one instead, and the label rides a ring around it. The ring
   * turns only while the track is playing, so the control states what it is
   * doing without a second icon: still means silent.
   *
   * Mute is deliberately absent here. On a pill there is room for three
   * targets; on a 76px dial a second one is a mis-tap, and pause already
   * gives the guest the one thing they want when the music is unwelcome.
   */
  if (el.variant === 'dial') {
    const label = el.title || (isKz ? 'Өлең қосу' : 'Включить музыку');
    const ring = `${label} · ${label} · `;
    return (
      <div
        style={{
          position: 'relative',
          width: 76,
          height: 76,
          cursor: 'pointer',
          color: textColor,
        }}
        onClick={togglePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePlay();
          }
        }}
        title={playing ? (isKz ? 'Кідірту' : 'Пауза') : label}
      >
        <audio ref={audioRef} src={src} preload="none" loop />
        <svg
          viewBox="0 0 76 76"
          width={76}
          height={76}
          style={{
            position: 'absolute',
            inset: 0,
            animation: playing ? 'canvas-music-dial 18s linear infinite' : 'none',
          }}
          aria-hidden
        >
          <defs>
            <path
              id={`ring-${ringId}`}
              d="M 38,38 m -30,0 a 30,30 0 1,1 60,0 a 30,30 0 1,1 -60,0"
              fill="none"
            />
          </defs>
          <text
            fill={textColor}
            style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase' }}
          >
            <textPath href={`#ring-${ringId}`} startOffset="0">
              {ring}
            </textPath>
          </text>
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 13,
            borderRadius: '50%',
            border: `1px solid ${accent}59`,
            backgroundColor: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            boxShadow: '0 6px 18px rgba(58,42,28,0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        // A bit bigger throughout: this is permanent page chrome pinned over
        // the artwork on every scroll position, not a one-off inline control,
        // so it needs a touch target and a presence to match — the original
        // 13px/6·12px pill read as an afterthought next to the invitation.
        padding: '8px 14px',
        borderRadius: 999,
        backgroundColor: 'rgba(12,14,17,0.55)',
        border: `1px solid ${accent}66`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: textColor,
        boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.06em',
        cursor: 'pointer',
      }}
    >
      {/* `loop` is declared here rather than set imperatively in the effect
          (`audio.loop = true`): the DOM property reflects back to the attribute,
          so the server HTML had no `loop` and the hydrated DOM did, leaving the
          two permanently out of step for anything comparing them. */}
      <audio ref={audioRef} src={src} preload="none" loop />
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
        title={playing ? (isKz ? 'Кідірту' : 'Пауза') : (isKz ? 'Ойнату' : 'Воспроизведение')}
      >
        {playing ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
      </button>
      <span>{el.title || (isKz ? 'Әуен' : 'Музыка')}</span>
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
        title={muted ? (isKz ? 'Дыбысты қосу' : 'Включить звук') : (isKz ? 'Дыбыссыз' : 'Без звука')}
      >
        {muted ? <VolumeX size={17} aria-hidden /> : <Volume2 size={17} aria-hidden />}
      </button>
    </div>
  );
}
