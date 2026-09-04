/**
 * Reorders the vertical stacking of the canvas' built-in "sections" (see
 * ElementSettingsConfig.ts EDITOR_SECTION_DEFS) by repositioning every
 * element's `y` — the canvas document has no separate ordering concept of
 * its own, elements are absolutely positioned, so "reordering a section"
 * means recomputing the y offsets of every element in it (and everything
 * below it) rather than moving an entry in an array.
 *
 * Height of an `h: 'auto'` element isn't known without measuring the live
 * DOM, so this uses a fixed per-type estimate (same order of magnitude as
 * the increments legacy-converter.ts already uses when laying out a fresh
 * document). Spacing after reorder is approximate, not pixel-perfect — the
 * host can still nudge elements by hand afterward like any other edit.
 */
import type { CanvasElement, CanvasElementType, InvitationCanvasDocument } from './types';
import { editorSectionsFor, type EditorSection } from '@/components/canvas/ElementSettingsConfig';

const SECTION_GAP_PX = 24;

const HEIGHT_ESTIMATE: Partial<Record<CanvasElementType, number>> = {
  text: 40,
  heading: 60,
  'couple-names': 110,
  countdown: 110,
  'rsvp-form': 260,
  wishes: 220,
  program: 200,
  map: 260,
  music: 80,
  gift: 180,
  image: 340,
  button: 56,
  divider: 8,
  ornament: 60,
  qr: 160,
  lottie: 160,
  'video-bg': 300,
  shape: 60,
};

function elementHeight(el: CanvasElement): number {
  if (typeof el.h === 'number') return el.h;
  return HEIGHT_ESTIMATE[el.type] ?? 80;
}

/** Full ordered list of section ids: `order` first, then any built-in
 *  section not mentioned in it (e.g. a section added after the document's
 *  sectionOrder was last saved), in the default definition order. */
export function resolveFullSectionOrder(order: string[] | undefined, locale: 'ru' | 'kz' = 'ru'): string[] {
  const allIds = editorSectionsFor(locale).map((s) => s.id);
  if (!order || order.length === 0) return allIds;
  const known = order.filter((id) => allIds.includes(id));
  const missing = allIds.filter((id) => !known.includes(id));
  return [...known, ...missing];
}

/**
 * Recompute every matched element's `y` so sections render top-to-bottom in
 * `sectionOrder`. Elements that don't match any built-in section keep their
 * original position untouched (appended at the end of the array, unmoved).
 */
export function relayoutBySectionOrder(
  doc: InvitationCanvasDocument,
  sectionOrder: string[],
  locale: 'ru' | 'kz' = 'ru'
): InvitationCanvasDocument {
  const sections = editorSectionsFor(locale);
  const sectionForType = (type: CanvasElementType): EditorSection | undefined =>
    sections.find((s) => s.matches.includes(type));

  const bySection = new Map<string, CanvasElement[]>();
  for (const s of sections) bySection.set(s.id, []);
  const unmatched: CanvasElement[] = [];

  for (const el of doc.elements) {
    const sec = sectionForType(el.type);
    if (sec) bySection.get(sec.id)!.push(el);
    else unmatched.push(el);
  }

  const fullOrder = resolveFullSectionOrder(sectionOrder, locale);
  const topMargin = Math.min(...doc.elements.map((e) => e.y), 0);
  let cursor = topMargin;
  const relaidElements: CanvasElement[] = [];

  for (const id of fullOrder) {
    const els = bySection.get(id) ?? [];
    if (els.length === 0) continue;
    const minY = Math.min(...els.map((e) => e.y));
    const maxBottom = Math.max(...els.map((e) => e.y + elementHeight(e)));
    const delta = cursor - minY;
    for (const el of els) relaidElements.push({ ...el, y: el.y + delta });
    cursor += (maxBottom - minY) + SECTION_GAP_PX;
  }

  return {
    ...doc,
    elements: [...relaidElements, ...unmatched],
    sectionOrder: fullOrder,
  };
}

/** Swap a section with its neighbor (direction: -1 = up, +1 = down). */
export function moveSectionInOrder(
  currentOrder: string[],
  sectionId: string,
  direction: -1 | 1
): string[] {
  const idx = currentOrder.indexOf(sectionId);
  if (idx === -1) return currentOrder;
  const swapWith = idx + direction;
  if (swapWith < 0 || swapWith >= currentOrder.length) return currentOrder;
  const next = [...currentOrder];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
  return next;
}
