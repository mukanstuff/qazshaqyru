'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
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
 * What replaced it was a card at the top of the page with a heading, a line of
 * explanation, a button and a close control — which is shaqyru24's own
 * `pb-form-reminder` almost element for element, and reads as theirs.
 *
 * This is the same job done with the smallest thing that can do it: one pill
 * in the invitation's own accent, at the foot of the screen, carrying the verb
 * and nothing else. It appears only while the guest is past the opening screen
 * AND the reply block is off screen, so it never competes with the block it
 * points at and there is nothing to dismiss — it takes itself away.
 *
 * It is deliberately quiet about the things it no longer offers:
 *  - route: templates carry their own «Картадан қарау» button;
 *  - calendar: the .ics link is still served at /api/invitations/public/<slug>/ics
 *    for templates that want a button for it — it was confusing as an icon,
 *    because tapping it silently downloads a file on desktop;
 *  - share: forwarding is the host's job, and the host has their own controls.
 */
const LABELS = {
  ru: { cta: 'Ответить' },
  kz: { cta: 'Жауап беру' },
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
  const [pastHero, setPastHero] = useState(false);
  const [replyOnScreen, setReplyOnScreen] = useState(false);

  const hasRsvp = doc.elements.some((el) => el.type === 'rsvp-form');
  void slug;

  useEffect(() => {
    const onAnswered = () => setAnswered(true);
    window.addEventListener('qazshaqyru:rsvp-answered', onAnswered);
    return () => window.removeEventListener('qazshaqyru:rsvp-answered', onAnswered);
  }, []);

  /*
   * Never over the opening screen.
   *
   * The hero is the frame the guest screenshots and forwards; covering it with
   * a notice is the one thing this component must not do.
   */
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 1.1);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
   * Stand down when the reply block is on screen.
   *
   * A shortcut to a thing the guest is already looking at is noise, and worse,
   * it covers the form it points at — the pill sits exactly where the send
   * button ends up on a phone.
   */
  useEffect(() => {
    if (!hasRsvp) return;
    const target = window.document.getElementById('rsvp');
    if (!target || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver(
      ([entry]) => setReplyOnScreen(entry.isIntersecting),
      { rootMargin: '-10% 0px -20% 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasRsvp]);

  const scrollToRsvp = useCallback(() => {
    const target = window.document.getElementById('rsvp');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const { accent, dark } = useMemo(() => accentOf(doc), [doc]);

  if (!hasRsvp || !canRsvp || answered || !pastHero || replyOnScreen) return null;

  return (
    <div className="qs-nudge-wrap">
      <button
        type="button"
        className="qs-nudge"
        onClick={scrollToRsvp}
        style={
          {
            ['--qs-nudge-accent' as string]: accent,
            // The accent is the template's own button fill; on the pale ones
            // white type on it is what the template itself already does, and
            // on a dark document the accent is a metal and wants dark type.
            ['--qs-nudge-on-accent' as string]: dark ? '#141519' : '#ffffff',
          } as React.CSSProperties
        }
      >
        {t.cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
