import { describe, it, expect } from 'vitest';
import { fieldsForSectionType, readFieldValue } from '@/lib/invitations/editor-section-fields';
import type { InvitationDocument } from '@/lib/invitations/document';

describe('editor-section-fields', () => {
  it('returns name fields for hero-names', () => {
    const fields = fieldsForSectionType('hero-names');
    expect(fields.map((f) => f.path)).toEqual([
      'customText.groomName',
      'customText.brideName',
    ]);
  });

  it('returns empty for rsvp (visibility-only)', () => {
    expect(fieldsForSectionType('rsvp')).toEqual([]);
  });

  it('reads nested values from document', () => {
    const doc = {
      customText: { groomName: 'Ерлан' },
      templateData: { coverPhoto: 'https://x.test/a.jpg' },
      meta: { eventDate: '2026-12-01T15:00:00.000Z', eventPlace: 'Алматы' },
    } as unknown as InvitationDocument;

    expect(readFieldValue(doc, 'customText.groomName')).toBe('Ерлан');
    expect(readFieldValue(doc, 'templateData.coverPhoto')).toBe('https://x.test/a.jpg');
    expect(readFieldValue(doc, 'eventDate')).toBe('2026-12-01');
    expect(readFieldValue(doc, 'eventPlace')).toBe('Алматы');
  });
});
