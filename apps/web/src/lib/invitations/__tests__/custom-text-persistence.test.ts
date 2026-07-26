import { describe, expect, it } from 'vitest';
import {
  getCustomTextPersistenceActions,
  serializeCustomTextFieldValue,
} from '../custom-text-persistence';

describe('serializeCustomTextFieldValue', () => {
  it('serializes openRsvp as true/false strings', () => {
    expect(serializeCustomTextFieldValue('openRsvp', true)).toBe('true');
    expect(serializeCustomTextFieldValue('openRsvp', false)).toBe('false');
  });

  it('serializes program as JSON', () => {
    const program = [{ time: '18:00', title: 'Той' }];
    expect(serializeCustomTextFieldValue('program', program)).toBe(JSON.stringify(program));
  });

  it('serializes string fields', () => {
    expect(serializeCustomTextFieldValue('kaspiPhone', '+77001234567')).toBe('+77001234567');
    expect(serializeCustomTextFieldValue('greeting', 'Сәлем')).toBe('Сәлем');
  });
});

describe('getCustomTextPersistenceActions', () => {
  it('returns actions for changed kaspiPhone, social, greeting', () => {
    const prev = { greeting: 'old', kaspiPhone: '' };
    const next = {
      greeting: 'new',
      kaspiPhone: '+77001112233',
      instagramUrl: 'https://instagram.com/test',
    };

    const actions = getCustomTextPersistenceActions(prev, next);

    expect(actions).toEqual(
      expect.arrayContaining([
        { field: 'customText.greeting', value: 'new' },
        { field: 'customText.kaspiPhone', value: '+77001112233' },
        { field: 'customText.instagramUrl', value: 'https://instagram.com/test' },
      ]),
    );
    expect(actions).toHaveLength(3);
  });

  it('returns openRsvp action when toggled', () => {
    const actions = getCustomTextPersistenceActions({ openRsvp: false }, { openRsvp: true });
    expect(actions).toEqual([{ field: 'customText.openRsvp', value: 'true' }]);
  });

  it('returns empty when customText unchanged', () => {
    const ct = { kaspiPhone: '+7', greeting: 'hi' };
    expect(getCustomTextPersistenceActions(ct, { ...ct })).toEqual([]);
  });
});
