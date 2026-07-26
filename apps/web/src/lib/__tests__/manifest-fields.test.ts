import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BODY_KZ,
  interpolateFieldTemplate,
  resolveManifestFields,
} from '@/lib/templates/manifest-fields';
import type { InvitationData } from '@/components/invitation-layouts/types';

const baseInvitation: InvitationData = {
  id: '1',
  slug: 'test',
  title: 'Айгерім & Нұрлан',
  eventType: 'wedding',
  eventDate: '2026-08-15T00:00:00.000Z',
  eventTime: '18:00',
  eventPlace: 'Мейрамхана',
  eventTimezone: 'Asia/Almaty',
  templateKey: 'wedding-luxury',
  templateData: {},
  language: 'kz',
  isPast: false,
};

describe('manifest-fields', () => {
  it('parses groom and bride from title', () => {
    const fields = resolveManifestFields(baseInvitation);
    expect(fields.brideName).toBe('Айгерім');
    expect(fields.groomName).toBe('Нұрлан');
  });

  it('interpolates names in body template', () => {
    const fields = resolveManifestFields(baseInvitation);
    const body = interpolateFieldTemplate(DEFAULT_BODY_KZ, fields);
    expect(body).toContain('Нұрлан');
    expect(body).toContain('Айгерім');
  });

  it('prefers customText groomName/brideName', () => {
    const fields = resolveManifestFields({
      ...baseInvitation,
      customText: { groomName: 'Ерлан', brideName: 'Дана' },
    });
    expect(fields.groomName).toBe('Ерлан');
    expect(fields.brideName).toBe('Дана');
  });

  it('does not invent Жігіт for single-title invitations', () => {
    const fields = resolveManifestFields({
      ...baseInvitation,
      title: 'Audit Wedding',
      customText: {},
    });
    expect(fields.brideName).toBe('Audit Wedding');
    expect(fields.groomName).toBe('');
    expect(fields.groomName).not.toBe('Жігіт');
  });

  it('parses names separated by и', () => {
    const fields = resolveManifestFields({
      ...baseInvitation,
      title: 'Айгерим и Нурлан',
      language: 'ru',
      customText: {},
    });
    expect(fields.brideName).toBe('Айгерим');
    expect(fields.groomName).toBe('Нурлан');
  });
});
