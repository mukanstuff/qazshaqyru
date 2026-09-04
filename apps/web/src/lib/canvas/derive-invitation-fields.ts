/**
 * Projects the canvas document (the single thing the editor, the wizard and
 * the hub all actually write to) onto the flat Invitation columns that
 * other parts of the app read without touching canvas: the OG image, the
 * .ics export, the browser tab title, WhatsApp reminders, the dashboard
 * list.
 *
 * Called on every canvas save so those columns can never drift from what
 * the guest actually sees on the page — instead of being written
 * separately by old hub forms that the canvas renderer never looked at.
 */
import type { CanvasElement, InvitationCanvasDocument } from './types';

export interface DerivedInvitationFields {
  title?: string;
  eventDate?: Date;
  eventTime?: string | null;
  eventPlace?: string;
  address?: string;
}

function findByPlaceholder(
  doc: InvitationCanvasDocument,
  key: string
): CanvasElement | undefined {
  return doc.elements.find((e) => e.placeholderKey === key);
}

function textOf(el: CanvasElement | undefined): string | undefined {
  if (!el) return undefined;
  if (el.type === 'text' || el.type === 'heading') {
    const t = el.text;
    return typeof t === 'string' && t.trim() ? t.trim() : undefined;
  }
  return undefined;
}

const TEXTUAL_CONNECTORS = new Set(['және', 'и']);

function coupleTitle(doc: InvitationCanvasDocument): string | undefined {
  const coupleEl = doc.elements.find((e): e is Extract<CanvasElement, { type: 'couple-names' }> => e.type === 'couple-names');
  if (coupleEl) {
    const first = coupleEl.first?.trim();
    const second = coupleEl.second?.trim();
    if (first && second) {
      const connector = TEXTUAL_CONNECTORS.has(coupleEl.connector) ? ` ${coupleEl.connector} ` : ' & ';
      return `${first}${connector}${second}`;
    }
    if (first || second) return first || second;
  }

  const groom = textOf(findByPlaceholder(doc, 'groomName'));
  const bride = textOf(findByPlaceholder(doc, 'brideName'));
  if (groom && bride) return `${groom} & ${bride}`;
  if (groom || bride) return groom || bride;

  return textOf(findByPlaceholder(doc, 'coupleNames'));
}

/** Only a real HH:mm value is trusted — free-form placeholder text ("после заката") stays out of the eventTime column that .ics/reminders format directly. */
function eventTimeOf(doc: InvitationCanvasDocument): string | undefined {
  const text = textOf(findByPlaceholder(doc, 'eventTime'));
  return text && /^\d{1,2}:\d{2}$/.test(text) ? text : undefined;
}

function venueOf(doc: InvitationCanvasDocument): { eventPlace?: string; address?: string } {
  const mapEl = doc.elements.find((e): e is Extract<CanvasElement, { type: 'map' }> => e.type === 'map');
  const eventPlace = mapEl?.markerTitle?.trim() || textOf(findByPlaceholder(doc, 'venueName'));
  const address = mapEl?.address?.trim() || textOf(findByPlaceholder(doc, 'venueAddress'));
  return { eventPlace, address };
}

export interface HubTextDefaults {
  groomName: string;
  brideName: string;
  greeting: string;
  dressCode: string;
}

/**
 * Initial values for the hub's "Тексты" sheet — read straight from the
 * canvas elements it edits, so what the form shows always matches what's
 * actually on the page (not a `customText` column the canvas renderer
 * never looked at).
 */
export function deriveHubTextDefaults(doc: InvitationCanvasDocument): HubTextDefaults {
  const coupleEl = doc.elements.find((e): e is Extract<CanvasElement, { type: 'couple-names' }> => e.type === 'couple-names');
  const groomName = coupleEl?.first?.trim() || textOf(findByPlaceholder(doc, 'groomName')) || '';
  const brideName = coupleEl?.second?.trim() || textOf(findByPlaceholder(doc, 'brideName')) || '';
  const greeting = textOf(findByPlaceholder(doc, 'greetingText')) || '';
  const dressCode = textOf(findByPlaceholder(doc, 'dressCode')) || '';
  return { groomName, brideName, greeting, dressCode };
}

/** Background-music URL the guest page actually plays, read off the canvas `music` element. */
export function deriveMusicUrl(doc: InvitationCanvasDocument): string {
  const musicEl = doc.elements.find((e): e is Extract<CanvasElement, { type: 'music' }> => e.type === 'music');
  if (!musicEl || musicEl.hidden) return '';
  return musicEl.audioSrc?.trim() || '';
}

export function deriveInvitationFieldsFromCanvas(doc: InvitationCanvasDocument): DerivedInvitationFields {
  const fields: DerivedInvitationFields = {};

  const title = coupleTitle(doc);
  if (title) fields.title = title;

  // A countdown's targetIso is the one place the wizard/editor writes a real
  // ISO timestamp instead of a locale-formatted display string — the only
  // safe source to parse a date back out of.
  const countdownEl = doc.elements.find(
    (e): e is Extract<CanvasElement, { type: 'countdown' }> => e.type === 'countdown' && !!e.targetIso
  );
  if (countdownEl?.targetIso) {
    const d = new Date(countdownEl.targetIso);
    if (!Number.isNaN(d.getTime())) fields.eventDate = d;
  }

  const eventTime = eventTimeOf(doc);
  if (eventTime) fields.eventTime = eventTime;

  const { eventPlace, address } = venueOf(doc);
  if (eventPlace) fields.eventPlace = eventPlace;
  if (address) fields.address = address;

  return fields;
}
