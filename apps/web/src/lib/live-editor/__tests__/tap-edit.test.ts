import { describe, expect, it } from 'vitest';
import { primaryFieldForSection, SECTION_PRIMARY_FIELD } from '../tap-edit';

describe('tap-edit', () => {
  it('maps hero and calendar sections to primary fields', () => {
    expect(primaryFieldForSection('hero-names')).toBe('customText.groomName');
    expect(primaryFieldForSection('calendar')).toBe('eventDate');
    expect(primaryFieldForSection('unknown')).toBeNull();
  });

  it('covers core guest-facing sections', () => {
    expect(Object.keys(SECTION_PRIMARY_FIELD).length).toBeGreaterThanOrEqual(8);
    expect(SECTION_PRIMARY_FIELD['cover-photo']).toBe('templateData.coverPhoto');
    expect(SECTION_PRIMARY_FIELD['venue-map']).toBe('eventPlace');
  });
});
