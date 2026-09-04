'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import type { CountdownElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

function computeParts(target?: string, timezone = 'Asia/Almaty'): TimeParts {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  const t = new Date(target).getTime();
  if (Number.isNaN(t)) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  // Use Asia/Almaty offset (UTC+6) as simple offset. We can't rely on Intl in all envs
  // but for a client component this is best-effort; host timezone is fine.
  const now = Date.now();
  let diff = t - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  const days = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  void timezone;
  return { days, hours, minutes, seconds, finished: false };
}

/** Stable first render for both server and client — see below. */
const ZERO: TimeParts = { days: 0, hours: 0, minutes: 0, seconds: 0, finished: false };

export function CountdownElementView({ el }: { el: CountdownElement }) {
  // The initial state must NOT read the clock. It used to call computeParts()
  // in the useState initialiser, which runs once during SSR and again during
  // hydration — by then the seconds had moved on, React saw "20" from the
  // server and "18" from the client, and threw a hydration error that took the
  // whole editor subtree down with it (the canvas rendered as a blank page).
  //
  // Rendering zeros first is identical on both sides; the effect below fills in
  // real values on the very next tick after mount.
  const [parts, setParts] = useState<TimeParts>(ZERO);

  useEffect(() => {
    setParts(computeParts(el.targetIso, el.timezone));
    const t = setInterval(() => setParts(computeParts(el.targetIso, el.timezone)), 1000);
    return () => clearInterval(t);
  }, [el.targetIso, el.timezone]);

  const label = el.labels || { days: 'күн', hours: 'сағ', minutes: 'мин', seconds: 'сек' };
  const color = el.color;
  const accent = el.accentColor || '#c9a961';
  const box: CSSProperties = {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    fontFamily: fontStack(el.fontFamily),
    color,
    textAlign: 'center',
  };
  const item = (n: number, l: string) => (
    <div key={l} style={{ minWidth: 56 }}>
      {/*
        suppressHydrationWarning on the digits: this is a clock. The state above
        starts at ZERO so the first render matches the server, but the interval
        can land between React hydrating the parent and hydrating this node, and
        then React compares the server's "00" against a DOM that already reads
        "255" and reports "Text content does not match server-rendered HTML" —
        which aborts hydration for the whole subtree and forces a full client
        re-render of the invitation. Observed on /preview/<template>, four
        warnings, one per unit. The differing value is intentional here.
      */}
      <div
        suppressHydrationWarning
        style={{ fontSize: el.fontSize, fontWeight: 700, lineHeight: 1.1, color }}
      >
        {String(n).padStart(2, '0')}
      </div>
      {el.showLabels !== false && (
        <div style={{ fontSize: Math.max(10, el.fontSize * 0.4), color: accent, letterSpacing: 1, textTransform: 'uppercase' }}>{l}</div>
      )}
    </div>
  );
  return (
    <div style={box}>
      {parts.finished ? (
        <div style={{ fontSize: el.fontSize * 0.8 }}>♥</div>
      ) : (
        <>
          {item(parts.days, label.days)}
          {item(parts.hours, label.hours)}
          {item(parts.minutes, label.minutes)}
          {item(parts.seconds, label.seconds)}
        </>
      )}
    </div>
  );
}
