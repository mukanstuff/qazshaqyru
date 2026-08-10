/**
 * Legacy converter: translates the old "wedding-luxury" section-based
 * invitation format into a CanvasDocument, so old invitations keep
 * working after we switch to the new canvas engine.
 *
 * The result positions elements with explicit y coordinates (a vertical
 * scroll-page), using the same brand colors and fonts the legacy template
 * used. Text content is copied verbatim from templateData / customText.
 */
import type { InvitationCanvasDocument, CanvasElement } from './types';
import type { InvitationData } from '@/components/invitation-layouts/types';
import { createEmptyDocument } from './mutations';
import { nanoid } from 'nanoid';
import { splitCoupleNames } from '@/lib/shared/name-split';

interface LegacyInvitationLike {
  title?: string;
  eventType?: string;
  eventDate?: string | Date;
  eventTime?: string | null;
  eventPlace?: string | null;
  eventTimezone?: string;
  templateData?: Record<string, unknown> | null;
  musicUrl?: string | null;
  mapUrl?: string | null;
  address?: string | null;
  customText?: Record<string, unknown> | null;
}

const LUXURY_PRIMARY = '#6b1d3a';
const LUXURY_ACCENT = '#c9a961';
const LUXURY_BG = '#fff8f1';
const LUXURY_TEXT = '#2a1a22';

function fmtDate(d?: string | Date): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function textEl(
  id: string,
  y: number,
  text: string,
  opts: Partial<CanvasElement> & { fontSize?: number; color?: string; fontFamily?: 'Montserrat' | 'Cormorant' | 'Marck' | 'Unbounded' } = {}
): CanvasElement {
  return {
    id,
    type: 'text',
    x: 10,
    y,
    w: 80,
    h: 'auto',
    rotation: 0,
    zIndex: 2,
    locked: false,
    hidden: false,
    text,
    fontFamily: opts.fontFamily || 'Montserrat',
    fontSize: opts.fontSize || 16,
    fontWeight: 400,
    color: opts.color || LUXURY_TEXT,
    textAlign: 'center',
    lineHeight: 1.5,
    letterSpacing: 0.2,
  };
}

function headingEl(id: string, y: number, text: string, fontSize = 44): CanvasElement {
  return {
    id,
    type: 'heading',
    as: 'h1',
    x: 8,
    y,
    w: 84,
    h: 'auto',
    rotation: 0,
    zIndex: 3,
    locked: false,
    hidden: false,
    text,
    fontFamily: 'Cormorant',
    fontSize,
    fontWeight: 600,
    color: LUXURY_PRIMARY,
    textAlign: 'center',
    lineHeight: 1.15,
    letterSpacing: 1,
    italic: true,
  };
}

function dividerEl(id: string, y: number): CanvasElement {
  return {
    id,
    type: 'divider',
    x: 20,
    y,
    w: 60,
    h: 2,
    rotation: 0,
    zIndex: 2,
    locked: false,
    hidden: false,
    color: LUXURY_ACCENT,
    thickness: 2,
    style: 'solid',
  };
}

/**
 * Convert any legacy invitation (section format) to a CanvasDocument.
 * If the source uses wedding-luxury (the only template currently shipping),
 * we approximate its layout closely enough to look familiar.
 */
export function convertLegacyToCanvas(inv: LegacyInvitationLike): InvitationCanvasDocument {
  const td = (inv.templateData || {}) as Record<string, string | undefined>;
  const ct = (inv.customText || {}) as Record<string, string | undefined>;

  // 2026-08-05 FIX: wizard creates invitations with names in `title` field
  // (buildInvitationTitle = "Name1 & Name2"), NOT in customText fields.
  // Parse names from title as fallback when customText.groomName/brideName empty.
  // titleParts[0] = groom (first), titleParts[1] = bride (second)
  const titleParts = splitCoupleNames(inv.title || '');
  const firstName = ct.groomName || titleParts[0] || '';
  const secondName = ct.brideName || titleParts[1] || '';

  // locale from customText
  const isKz = ct.invitationLocale === 'kz';

  // Respect colorScheme if provided (from wizard step 6)
  const scheme = td.colorScheme || 'bordeaux-gold';
  const bg = scheme === 'bordeaux-gold' ? LUXURY_BG :
             scheme === 'rose-gold' ? '#fdf2f4' :
             scheme === 'classic-mono' ? '#f8f8f8' :
             scheme === 'emerald-gold' ? '#f0f7f2' :
             scheme === 'oriental' ? '#fffaf0' : '#f9f7f4';

  const doc = createEmptyDocument(390, { type: 'solid', color: bg });
  const elements: CanvasElement[] = [];
  let y = 80;
  const z = () => elements.length + 1;

  // Optional cover photo
  if (td.coverPhoto) {
    elements.push({
      id: nanoid(10),
      type: 'image',
      x: 0,
      y,
      w: 100,
      h: 320,
      rotation: 0,
      zIndex: z(),
      locked: false,
      hidden: false,
      src: td.coverPhoto,
      objectFit: 'cover',
      borderRadius: 0,
      overlayColor: 'rgba(107,29,58,0.15)',
      placeholderKey: 'coverPhoto',
    });
    y += 340;
  }

  // Hero greeting — locale-aware default
  // TODO: add proper Kazakh text (Qurmetti qonaqtar) when encoding issue resolved
  const greetingText = ct.greeting || (isKz ? 'Qurmetti qonaqtar!' : 'Dorogie gosti!');
  elements.push(textEl(nanoid(10), y, greetingText, {
    fontFamily: 'Marck',
    fontSize: 24,
    color: LUXURY_PRIMARY,
  }));
  y += 60;

  // Couple names — from title or customText
  if (firstName || secondName) {
    elements.push({
      id: nanoid(10),
      type: 'couple-names',
      x: 5,
      y,
      w: 90,
      h: 'auto',
      rotation: 0,
      zIndex: z(),
      locked: false,
      hidden: false,
      first: firstName,
      second: secondName,
      connector: '&',
      font: 'Cormorant',
      fontSize: 56,
      color: LUXURY_PRIMARY,
      placeholderKey: 'coupleNames',
    });
    y += 110;
  }

  elements.push(dividerEl(nanoid(10), y));
  y += 30;

  const dateStr = fmtDate(inv.eventDate);
  if (dateStr) {
    const elDate = headingEl(nanoid(10), y, dateStr, 28);
    elDate.placeholderKey = 'eventDate';
    elements.push(elDate);
    y += 60;
  }

  if (inv.eventTime) {
    elements.push(textEl(nanoid(10), y, `\u231A ${inv.eventTime}`, { fontSize: 18 }));
    y += 40;
  }

  if (inv.eventPlace || inv.address) {
    const elPlace = textEl(nanoid(10), y, inv.eventPlace || inv.address || '', {
      fontSize: 18,
      color: LUXURY_PRIMARY,
    });
    elPlace.placeholderKey = 'venueName';
    elements.push(elPlace);
    y += 40;
  }
  if (inv.address) {
    const elAddr = textEl(nanoid(10), y, inv.address, { fontSize: 14, color: LUXURY_TEXT });
    elAddr.placeholderKey = 'venueAddress';
    elements.push(elAddr);
    y += 50;
  }

  elements.push(dividerEl(nanoid(10), y));
  y += 30;

  // Countdown with locale-aware labels
  const countdownLabels = isKz
    ? { days: 'kun', hours: 'sag', minutes: 'min', seconds: 'sek' }
    : { days: 'dney', hours: 'chasov', minutes: 'min', seconds: 'sek' };
  elements.push({
    id: nanoid(10),
    type: 'countdown',
    x: 5,
    y,
    w: 90,
    h: 'auto',
    rotation: 0,
    zIndex: z(),
    locked: false,
    hidden: false,
    targetIso: typeof inv.eventDate === 'string' ? inv.eventDate : inv.eventDate?.toISOString(),
    timezone: inv.eventTimezone || 'Asia/Almaty',
    fontFamily: 'Unbounded',
    fontSize: 20,
    color: LUXURY_PRIMARY,
    showLabels: true,
    labels: countdownLabels,
  });
  y += 110;

  // RSVP button with locale-aware label
  const rsvpLabel = isKz ? 'Zhawap beru' : 'Otvetit';
  elements.push({
    id: nanoid(10),
    type: 'button',
    x: 15,
    y,
    w: 70,
    h: 56,
    rotation: 0,
    zIndex: z(),
    locked: false,
    hidden: false,
    label: rsvpLabel,
    action: { kind: 'rsvp' },
    bgColor: LUXURY_PRIMARY,
    textColor: '#ffffff',
    fontSize: 16,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    borderRadius: 999,
  });
  y += 80;

  if (inv.musicUrl) {
    elements.push({
      id: nanoid(10),
      type: 'music',
      x: 15,
      y,
      w: 70,
      h: 64,
      rotation: 0,
      zIndex: z(),
      locked: false,
      hidden: false,
      audioSrc: inv.musicUrl,
      accentColor: LUXURY_PRIMARY,
      autoPlayMuted: true,
    });
    y += 80;
  }

  // Attach elements (auto-assign zIndex for any I missed)
  elements.forEach((el, i) => {
    el.zIndex = i + 1;
  });

  return { ...doc, elements };
}

/**
 * Convert an InvitationData object (the shape used by the public guest page)
 * into a canvas doc — useful for the guest page fallback path.
 */
export function convertInvitationDataToCanvas(data: InvitationData): InvitationCanvasDocument {
  return convertLegacyToCanvas({
    title: data.title,
    eventType: data.eventType,
    eventDate: data.eventDate,
    eventTime: data.eventTime,
    eventPlace: data.eventPlace,
    eventTimezone: data.eventTimezone,
    templateData: data.templateData as Record<string, unknown>,
    musicUrl: data.musicUrl,
    mapUrl: data.mapUrl,
    address: data.address,
    customText: data.customText as Record<string, unknown>,
  });
}
