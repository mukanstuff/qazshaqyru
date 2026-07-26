'use client';

import { useEffect, useState } from 'react';
import type { SectionProps } from './types';

import { hasSeenEnvelope, markEnvelopeSeen } from '../guest-mobile';

export function EnvelopeIntroSection({ ctx, sectionProps }: SectionProps) {
  const slug = ctx.invitation.slug;
  const [open, setOpen] = useState(() =>
    typeof window === 'undefined' ? false : hasSeenEnvelope(slug),
  );
  const isKz = ctx.invitation.language === 'kz';
  const label = isKz ? 'Ашу үшін басыңыз' : 'Нажмите, чтобы открыть';

  useEffect(() => {
    if (ctx.suppressGuestChrome) return;
    if (hasSeenEnvelope(slug)) {
      setOpen(true);
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setOpen(true);
      markEnvelopeSeen(slug);
      window.dispatchEvent(new Event('qazshaqyru:envelope-open'));
    }
  }, [ctx.suppressGuestChrome, slug]);

  if (ctx.suppressGuestChrome) return null;

  return (
    <section
      className={`inv-envelope-intro${open ? ' inv-envelope-intro--open' : ''}`}
      data-section="envelope-intro"
      aria-hidden={open}
    >
      <button
        type="button"
        className="inv-envelope-intro__tap"
        onClick={() => {
          setOpen(true);
          markEnvelopeSeen(slug);
          window.dispatchEvent(new Event('qazshaqyru:envelope-open'));
        }}
        aria-label={label}
      >
        <div className={`inv-envelope-intro__flap inv-envelope-intro__flap--${sectionProps?.variant ?? 'gold'}`} />
        <div className="inv-envelope-intro__body">
          <span className="inv-envelope-intro__seal" aria-hidden>
            ♥
          </span>
        </div>
        <p className="inv-envelope-intro__hint">{label}</p>
      </button>
    </section>
  );
}
