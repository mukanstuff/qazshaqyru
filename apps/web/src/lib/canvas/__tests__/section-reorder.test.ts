import { describe, it, expect } from 'vitest';
import { createEmptyDocument, addElement } from '../mutations';
import {
  relayoutBySectionOrder,
  resolveFullSectionOrder,
  moveSectionInOrder,
} from '../section-reorder';

function buildDoc() {
  let doc = createEmptyDocument();
  doc = addElement(doc, 'text', { id: 'text-1', y: 100 });
  doc = addElement(doc, 'countdown', { id: 'countdown-1', y: 300, h: 120 });
  doc = addElement(doc, 'rsvp-form', { id: 'rsvp-1', y: 600, h: 200 });
  return doc;
}

describe('resolveFullSectionOrder', () => {
  it('returns the default built-in order when no order is given', () => {
    const order = resolveFullSectionOrder(undefined, 'ru');
    expect(order[0]).toBe('text');
    expect(order).toContain('rsvp');
  });

  it('appends built-in sections missing from a partial order', () => {
    const order = resolveFullSectionOrder(['rsvp', 'text'], 'ru');
    expect(order[0]).toBe('rsvp');
    expect(order[1]).toBe('text');
    expect(order).toContain('countdown'); // not mentioned, appended after
    expect(order.indexOf('countdown')).toBeGreaterThan(1);
  });

  it('drops unknown ids from a stale order', () => {
    const order = resolveFullSectionOrder(['not-a-real-section', 'text'], 'ru');
    expect(order).not.toContain('not-a-real-section');
    expect(order[0]).toBe('text');
  });
});

describe('moveSectionInOrder', () => {
  it('swaps a section with its next neighbor', () => {
    const next = moveSectionInOrder(['a', 'b', 'c'], 'a', 1);
    expect(next).toEqual(['b', 'a', 'c']);
  });

  it('swaps a section with its previous neighbor', () => {
    const next = moveSectionInOrder(['a', 'b', 'c'], 'c', -1);
    expect(next).toEqual(['a', 'c', 'b']);
  });

  it('is a no-op at the top boundary', () => {
    const order = ['a', 'b', 'c'];
    expect(moveSectionInOrder(order, 'a', -1)).toBe(order);
  });

  it('is a no-op at the bottom boundary', () => {
    const order = ['a', 'b', 'c'];
    expect(moveSectionInOrder(order, 'c', 1)).toBe(order);
  });

  it('is a no-op for an id not present', () => {
    const order = ['a', 'b', 'c'];
    expect(moveSectionInOrder(order, 'z', 1)).toBe(order);
  });
});

describe('relayoutBySectionOrder', () => {
  it('repositions elements so sections stack top-to-bottom in the given order', () => {
    const doc = buildDoc();
    // Default document order is text(100) < countdown(300) < rsvp(600).
    // Move rsvp to the front.
    const result = relayoutBySectionOrder(doc, ['rsvp', 'countdown', 'text'], 'ru');

    const byId = new Map(result.elements.map((e) => [e.id, e]));
    const rsvpY = byId.get('rsvp-1')!.y;
    const countdownY = byId.get('countdown-1')!.y;
    const textY = byId.get('text-1')!.y;

    expect(rsvpY).toBeLessThan(countdownY);
    expect(countdownY).toBeLessThan(textY);
  });

  it('does not overlap consecutive sections (respects element height)', () => {
    const doc = buildDoc();
    const result = relayoutBySectionOrder(doc, ['text', 'countdown', 'rsvp'], 'ru');
    const byId = new Map(result.elements.map((e) => [e.id, e]));

    const text = byId.get('text-1')!;
    const countdown = byId.get('countdown-1')!;
    const rsvp = byId.get('rsvp-1')!;

    // countdown must start at/after text's bottom edge (text has an
    // estimated height since h isn't numeric on a fresh text element).
    const textBottom = text.y + (typeof text.h === 'number' ? text.h : 40);
    expect(countdown.y).toBeGreaterThanOrEqual(textBottom);

    const countdownBottom = countdown.y + (countdown.h as number);
    expect(rsvp.y).toBeGreaterThanOrEqual(countdownBottom);
  });

  it('preserves the elements array length (no element is dropped or duplicated)', () => {
    const doc = buildDoc();
    const result = relayoutBySectionOrder(doc, ['rsvp', 'text', 'countdown'], 'ru');
    expect(result.elements).toHaveLength(doc.elements.length);
    const ids = result.elements.map((e) => e.id).sort();
    expect(ids).toEqual(doc.elements.map((e) => e.id).sort());
  });

  it('stores the resolved full order on the document', () => {
    const doc = buildDoc();
    const result = relayoutBySectionOrder(doc, ['rsvp', 'text', 'countdown'], 'ru');
    expect(result.sectionOrder?.[0]).toBe('rsvp');
    expect(result.sectionOrder?.[1]).toBe('text');
    expect(result.sectionOrder?.[2]).toBe('countdown');
  });

  it('is idempotent: relaying out an already-ordered document keeps the same relative order', () => {
    const doc = buildDoc();
    const once = relayoutBySectionOrder(doc, ['rsvp', 'countdown', 'text'], 'ru');
    const twice = relayoutBySectionOrder(once, ['rsvp', 'countdown', 'text'], 'ru');

    const byId = new Map(twice.elements.map((e) => [e.id, e]));
    expect(byId.get('rsvp-1')!.y).toBeLessThan(byId.get('countdown-1')!.y);
    expect(byId.get('countdown-1')!.y).toBeLessThan(byId.get('text-1')!.y);
  });
});
