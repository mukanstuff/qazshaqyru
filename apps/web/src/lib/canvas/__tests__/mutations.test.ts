import { describe, it, expect } from 'vitest';
import {
  addElement,
  createEmptyDocument,
  deleteElement,
  duplicateElement,
  HistoryStack,
  moveElement,
  updateElement,
  normalizeZIndices,
} from '../mutations';
import type { TextElement } from '../types';

describe('canvas mutations', () => {
  it('creates an empty document with defaults', () => {
    const doc = createEmptyDocument();
    expect(doc.version).toBe(1);
    expect(doc.width).toBe(390);
    expect(doc.elements).toHaveLength(0);
    expect(doc.background.type).toBe('solid');
  });

  it('adds a text element with sensible defaults', () => {
    let doc = createEmptyDocument();
    doc = addElement(doc, 'text', { text: 'Сәлем' });
    expect(doc.elements).toHaveLength(1);
    expect(doc.elements[0].type).toBe('text');
    expect((doc.elements[0] as TextElement).text).toBe('Сәлем');
    expect(doc.elements[0].zIndex).toBeGreaterThanOrEqual(1);
  });

  it('updates an element immutably', () => {
    let doc = createEmptyDocument();
    doc = addElement(doc, 'text');
    const id = doc.elements[0].id;
    const next = updateElement(doc, id, { x: 42 } as Partial<TextElement>);
    expect(next.elements[0].x).toBe(42);
    expect(doc.elements[0].x).not.toBe(42); // original unchanged
    expect(next).not.toBe(doc);
  });

  it('deletes an element by id', () => {
    let doc = createEmptyDocument();
    doc = addElement(doc, 'text');
    doc = addElement(doc, 'heading');
    expect(doc.elements).toHaveLength(2);
    const kill = doc.elements[0].id;
    const next = deleteElement(doc, kill);
    expect(next.elements).toHaveLength(1);
    expect(next.elements.find((e) => e.id === kill)).toBeUndefined();
  });

  it('duplicates an element with new id and offset', () => {
    let doc = createEmptyDocument();
    doc = addElement(doc, 'text');
    const srcId = doc.elements[0].id;
    const next = duplicateElement(doc, srcId);
    expect(next.elements).toHaveLength(2);
    expect(next.elements[1].id).not.toBe(srcId);
    expect(next.elements[1].y).not.toBe(doc.elements[0].y);
  });

  it('normalizes z-indices after repeated moves', () => {
    let doc = createEmptyDocument();
    doc = addElement(doc, 'text');
    doc = addElement(doc, 'heading');
    doc = addElement(doc, 'shape');
    const front = moveElement(doc, doc.elements[0].id, 'front');
    const norm = normalizeZIndices(front);
    const zs = norm.elements.map((e) => e.zIndex).sort((a, b) => a - b);
    expect(zs).toEqual([1, 2, 3]);
  });

  it('history stack supports undo/redo', () => {
    let doc = createEmptyDocument();
    const stack = new HistoryStack(doc);
    doc = addElement(doc, 'text', { text: 'a' });
    stack.pushSnapshot(doc);
    const withText = stack.present;
    expect(withText.elements.length).toBe(1);

    const withText2 = addElement(withText, 'heading', { text: 'b' });
    stack.pushSnapshot(withText2);
    expect(stack.present.elements.length).toBe(2);

    expect(stack.canUndo()).toBe(true);
    stack.undo();
    expect(stack.present.elements.length).toBe(1);
    expect(stack.canRedo()).toBe(true);
    stack.redo();
    expect(stack.present.elements.length).toBe(2);
  });
});
