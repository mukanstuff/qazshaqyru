'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

/**
 * The "don't forget to reply" reminder.
 *
 * This replaces a pinned four-action toolbar (reply / route / calendar /
 * share) that sat over the invitation for the whole visit. The toolbar solved
 * a real problem — a guest had no way to answer without scrolling the entire
 * page — but it solved it by parking a piece of app chrome on top of a design
 * the customer paid for, and three of its four actions duplicated controls the
 * template already draws (the map button, the RSVP block, the host's share).
 *
 * A reminder is the same nudge without the residency: it appears once the
 * guest has read past the opening screen, says the one thing the host actually
 * needs, and leaves. Modelled on shaqyru24's own `pb-form-reminder`, which
 * does exactly this at the top of the page.
 *
 * It is deliberately quiet about the things it no longer offers:
 *  - route: templates carry their own «Картадан қарау» button;
 *  - calendar: the .ics link is still served at /api/invitations/public/<slug>/ics
 *    for templates that want a button for it — it was confusing as an icon,
 *    because tapping it silently downloads a file on desktop;
 *  - share: forwarding is the host's job, and the host has their own controls.
 */
const LABELS = {
  ru: {
    title: 'Не забудьте ответить',
    body: 'Хозяевам важно знать, придёте ли вы',
    cta: 'Ответить',
    close: 'Закрыть',
  },
  kz: {
    title: 'Жауап беруді ұмытпаңыз',
    body: 'Той иелеріне келетініңізді білу маңызды',
    cta: 'Жауап беру',
    close: 'Жабу',
  },
} as const;

interface Props {
  document: InvitationCanvasDocument;
  shareUrl: string;
  slug: string;
  locale: 'ru' | 'kz';
  /** False when this visitor cannot answer from this link (personal-link-only). */
  canRsvp: boolean;
}

function luminance(hex: string): number {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return 1;
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Take the reminder's accent from the design, not from the app.
 *
 * The bar this replaces shipped the product's brand green, and for light
 * documents it discarded the computed palette entirely and fell back to it —
 * so an ivory, gold and қызыл invitation got a green pill stapled to it. A
 * button's own fill is the template's real call-to-action colour, so that is
 * what gets picked first.
 */
function accentOf(doc: InvitationCanvasDocument): { accent: string; dark: boolean } {
  const bg = doc.background;
  const ground = (bg.type === 'gradient' ? bg.gradient?.from : undefined) ?? bg.color ?? '#ffffff';
  const dark = luminance(ground) < 0.4;

  for (const el of doc.elements) {
    if (el.type === 'button' && el.bgColor && el.bgColor !== 'transparent') {
      return { accent: el.bgColor, dark };
    }
  }
  for (const el of doc.elements) {
    if (el.type === 'rsvp-form' && el.accentColor) return { accent: el.accentColor, dark };
  }
  for (const el of doc.elements) {
    if (el.type === 'ornament' && el.color) return { accent: el.color, dark };
  }
  return { accent: dark ? '#c9a227' : '#6b1d3a', dark };
}

export function GuestActionBar({ document: doc, slug, locale, canRsvp }: Props) {
  const t = LABELS[locale];
  const [answered, setAnswered] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [shown, setShown] = useState(false);

  const hasRsvp = doc.elements.some((el) => el.type === 'rsvp-form');
  const storageKey = `qs-reminder-dismissed:${slug}`;

  // Dismissal is remembered for the session, so a guest who closed it and kept
  // reading is not nagged again on the way back up the page.
  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  useEffect(() => {
    const onAnswered = () => setAnswered(true);
    window.addEventListener('qazshaqyru:rsvp-answered', onAnswered);
    return () => window.removeEventListener('qazshaqyru:rsvp-answered', onAnswered);
  }, []);

  /*
   * Never over the opening screen.
   *
   * The hero is the frame the guest screenshots and forwards; covering it with
   * a notice is the one thing this component must not do. It waits until the
   * guest has scrolled a full viewport — by which point they are reading, and a
   * reminder is a help rather than an interruption.
   */
  useEffect(() => {
    if (shown) return;
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.1) setShown(true);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [shown]);

  const close = useCallback(() => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      /* private mode — the reminder simply reappears next visit */
    }
  }, [storageKey]);

  const scrollToRsvp = useCallback(() => {
    const target = window.document.getElementById('rsvp');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    close();
  }, [close]);

  const { accent, dark } = useMemo(() => accentOf(doc), [doc]);

  if (!hasRsvp || !canRsvp || answered || dismissed || !shown) return null;

  return (
    <div className="qs-reminder-wrap">
      <div
        className="qs-reminder"
        role="status"
        style={
          {
            ['--qs-rm-surface' as string]: dark ? 'rgba(20,22,26,0.94)' : 'rgba(255,255,255,0.96)',
            ['--qs-rm-text' as string]: dark ? 'rgba(240,236,227,0.95)' : '#2b2119',
            ['--qs-rm-quiet' as string]: dark ? 'rgba(240,236,227,0.6)' : 'rgba(43,33,25,0.62)',
            ['--qs-rm-accent' as string]: accent,
          } as React.CSSProperties
        }
      >
        <div className="qs-reminder__copy">
          <div className="qs-reminder__title">{t.title}</div>
          <div className="qs-reminder__body">{t.body}</div>
        </div>
        <button type="button" className="qs-reminder__cta" onClick={scrollToRsvp}>
          {t.cta}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button type="button" className="qs-reminder__close" onClick={close} aria-label={t.close}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
