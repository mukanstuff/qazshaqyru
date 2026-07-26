import { describe, it, expect } from 'vitest';
import { WEDDING_LUXURY_MANIFEST } from '@/lib/templates/manifests/wedding-luxury';
import {
  buildDefaultManifestFormValues,
  buildInvitationTitle,
  mapManifestFieldsToInvitation,
  validateManifestForm,
} from '@/lib/templates/map-manifest-to-invitation';
import { invitationToManifestFormValues } from '@/lib/templates/map-manifest-to-invitation';

const baseOptions = {
  templateKey: 'wedding-luxury',
  templateId: 'tpl-1',
  templateName: 'Свадьба Luxury',
  locale: 'kz' as const,
};

describe('map-manifest-to-invitation', () => {
  it('buildInvitationTitle formats bride & groom', () => {
    expect(buildInvitationTitle('Айгерім', 'Нұрлан')).toBe('Айгерім & Нұрлан');
    expect(buildInvitationTitle('', 'Нұрлан')).toBe('Нұрлан');
  });

  it('buildDefaultManifestFormValues includes interpolated body text', () => {
    const values = buildDefaultManifestFormValues(WEDDING_LUXURY_MANIFEST, 'kz');
    expect(values.groomName).toBeTruthy();
    expect(values.brideName).toBeTruthy();
    expect(values.hostsLine).toBe('');
    expect(values.bodyTextKz).toContain(values.groomName);
    expect(values.bodyTextKz).toContain(values.brideName);
    expect(values.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('validateManifestForm rejects missing required fields', () => {
    const values = buildDefaultManifestFormValues(WEDDING_LUXURY_MANIFEST, 'ru');
    const invalid = { ...values, groomName: '', venueName: '' };
    const result = validateManifestForm(WEDDING_LUXURY_MANIFEST, invalid, 'ru');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.groomName).toBeTruthy();
      expect(result.errors.venueName).toBeTruthy();
    }
  });

  it('validateManifestForm accepts valid wedding-luxury form', () => {
    const values = buildDefaultManifestFormValues(WEDDING_LUXURY_MANIFEST, 'kz');
    const result = validateManifestForm(WEDDING_LUXURY_MANIFEST, values, 'kz');
    expect(result.success).toBe(true);
  });

  it('mapManifestFieldsToInvitation writes customText and templateData', () => {
    const values = {
      ...buildDefaultManifestFormValues(WEDDING_LUXURY_MANIFEST, 'kz'),
      groomName: 'Нұрлан',
      brideName: 'Айгүл',
      venueName: 'Мейрамхана «Жарық»',
      venueAddress: 'Алматы',
      mapUrl: 'https://2gis.kz/almaty',
      coverPhoto: 'https://cdn.example/photo.jpg',
      eventDate: '2030-06-15',
      eventTime: '18:00',
    };

    const { invitation, draft } = mapManifestFieldsToInvitation(
      values,
      WEDDING_LUXURY_MANIFEST,
      baseOptions,
    );

    expect(invitation.title).toBe('Айгүл & Нұрлан');
    expect(invitation.eventPlace).toBe('Мейрамхана «Жарық»');
    expect(invitation.address).toBe('Алматы');
    expect(invitation.mapUrl).toBe('https://2gis.kz/almaty');
    expect(invitation.customText?.groomName).toBe('Нұрлан');
    expect(invitation.customText?.brideName).toBe('Айгүл');
    expect(invitation.customText?.bodyTextKz).toBeTruthy();
    expect(invitation.templateData.coverPhoto).toBe('https://cdn.example/photo.jpg');
    expect(draft.title).toBe(invitation.title);
    expect(draft.fromWizard).toBe(true);
  });

  it('invitationToManifestFormValues round-trips key fields', () => {
    const values = buildDefaultManifestFormValues(WEDDING_LUXURY_MANIFEST, 'ru');
    const { invitation } = mapManifestFieldsToInvitation(values, WEDDING_LUXURY_MANIFEST, {
      ...baseOptions,
      locale: 'ru',
    });
    const roundTrip = invitationToManifestFormValues(invitation);
    expect(roundTrip.groomName).toBe(values.groomName);
    expect(roundTrip.brideName).toBe(values.brideName);
    expect(roundTrip.venueName).toBe(values.venueName);
  });
});
