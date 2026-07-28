import { describe, it, expect } from 'vitest';
import { applyWizardToCanvasDocument } from '../apply-wizard-placeholders';
import type { InvitationCanvasDocument, TextElement, ImageElement } from '../types';

describe('applyWizardToCanvasDocument', () => {
  it('updates text elements matching placeholderKey coupleNames and eventPlace', () => {
    const doc: InvitationCanvasDocument = {
      version: 1,
      width: 390,
      background: { type: 'solid', color: '#ffffff' },
      elements: [
        {
          id: 'el-1',
          type: 'text',
          x: 10,
          y: 50,
          w: 80,
          h: 40,
          rotation: 0,
          zIndex: 1,
          locked: false,
          hidden: false,
          text: 'Старые имена',
          fontFamily: 'Montserrat',
          fontSize: 24,
          fontWeight: 700,
          color: '#000000',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 0,
          placeholderKey: 'coupleNames',
        } as TextElement,
        {
          id: 'el-2',
          type: 'text',
          x: 10,
          y: 100,
          w: 80,
          h: 40,
          rotation: 0,
          zIndex: 1,
          locked: false,
          hidden: false,
          text: 'Старое место',
          fontFamily: 'Montserrat',
          fontSize: 16,
          fontWeight: 400,
          color: '#000000',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 0,
          placeholderKey: 'venueName',
        } as TextElement,
      ],
    };

    const next = applyWizardToCanvasDocument(doc, {
      names: 'Айжан & Арман',
      eventPlace: 'Ресторан Алтын Орда',
    });

    expect((next.elements[0] as TextElement).text).toBe('Айжан & Арман');
    expect((next.elements[1] as TextElement).text).toBe('Ресторан Алтын Орда');
  });

  it('updates image element matching coverPhoto placeholderKey', () => {
    const doc: InvitationCanvasDocument = {
      version: 1,
      width: 390,
      background: { type: 'solid', color: '#ffffff' },
      elements: [
        {
          id: 'img-1',
          type: 'image',
          x: 0,
          y: 0,
          w: 100,
          h: 300,
          rotation: 0,
          zIndex: 1,
          locked: false,
          hidden: false,
          src: '/assets/placeholder.jpg',
          objectFit: 'cover',
          borderRadius: 0,
          placeholderKey: 'coverPhoto',
        } as ImageElement,
      ],
    };

    const next = applyWizardToCanvasDocument(doc, {
      coverPhoto: '/uploads/invitations/photo1.jpg',
    });

    expect((next.elements[0] as ImageElement).src).toBe('/uploads/invitations/photo1.jpg');
  });
});
