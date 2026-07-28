import { describe, it, expect } from 'vitest';
import { createEmptyDocument, addElement } from '@/lib/canvas/mutations';
import { applyWizardToCanvasDocument } from '@/lib/canvas/apply-wizard-placeholders';
import type { HeadingElement } from '@/lib/canvas/types';

describe('Admin template builder & placeholder binding', () => {
  it('creates an empty template document and marks element editableByEndUser and placeholderKey', () => {
    let doc = createEmptyDocument(390, { type: 'solid', color: '#fff8f1' });
    doc = addElement(doc, 'heading', {
      text: 'Имена пары',
      editableByEndUser: true,
      placeholderKey: 'coupleNames',
    });

    expect(doc.elements[0].editableByEndUser).toBe(true);
    expect(doc.elements[0].placeholderKey).toBe('coupleNames');

    const nextDoc = applyWizardToCanvasDocument(doc, {
      names: 'Алуа & Санжар',
    });

    expect((nextDoc.elements[0] as HeadingElement).text).toBe('Алуа & Санжар');
  });
});
