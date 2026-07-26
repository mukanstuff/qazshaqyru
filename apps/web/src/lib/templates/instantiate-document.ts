import type { InvitationDocument } from '@/lib/invitations/document';
import { syncDocumentStateIntoTemplateData } from '@/lib/invitations/document-state';
import {
  buildDefaultManifestFormValues,
  buildInvitationTitle,
  mapManifestFieldsToInvitation,
} from '@/lib/templates/map-manifest-to-invitation';
import type { TemplateManifest } from '@/lib/templates/manifest-types';
import { resolveSectionsFromManifest } from '@/lib/invitations/document-state';

export interface InstantiateInvitationOptions {
  templateId?: string;
  locale?: 'kz' | 'ru';
  invitationId?: string;
  slug?: string;
  status?: string;
}

/**
 * Contract → fresh InvitationDocument (schemaVersion 1).
 * Field defaults come from manifest via existing map helpers.
 */
export function instantiateInvitationDocument(
  manifest: TemplateManifest,
  options: InstantiateInvitationOptions = {},
): InvitationDocument {
  const locale = options.locale ?? 'ru';
  const formValues = buildDefaultManifestFormValues(manifest, locale);
  const mapped = mapManifestFieldsToInvitation(formValues, manifest, {
    templateKey: manifest.slug,
    templateId: options.templateId ?? '',
    templateName:
      buildInvitationTitle(formValues.brideName ?? '', formValues.groomName ?? '') ||
      manifest.slug,
    locale,
    serverInvitationId: options.invitationId,
  });

  const sections = resolveSectionsFromManifest(manifest, mapped.invitation.templateData);
  const theme = { ...manifest.theme };

  const document: InvitationDocument = {
    schemaVersion: 1,
    meta: {
      id: options.invitationId ?? 'draft',
      slug: options.slug ?? options.invitationId ?? 'draft',
      title: mapped.invitation.title,
      eventType: mapped.invitation.eventType,
      eventDate: mapped.invitation.eventDate,
      eventTime: mapped.invitation.eventTime ?? null,
      eventPlace: mapped.invitation.eventPlace ?? null,
      eventTimezone: mapped.invitation.eventTimezone,
      address: mapped.invitation.address ?? null,
      mapUrl: mapped.invitation.mapUrl ?? null,
      musicUrl: mapped.invitation.musicUrl ?? null,
      language: locale,
      hostName: null,
      isPast: false,
      templateKey: manifest.slug,
      templateId: options.templateId,
      status: options.status ?? 'draft',
    },
    fields: Object.entries({
      ...Object.fromEntries(
        Object.entries(mapped.invitation.templateData).map(([key, value]) => [
          `templateData.${key}`,
          value,
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(mapped.invitation.customText ?? {}).map(([key, value]) => [
          `customText.${key}`,
          value,
        ]),
      ),
    }).map(([id, value]) => ({
      id,
      type:
        typeof value === 'string' && /^https?:\/\//i.test(value)
          ? ('image' as const)
          : Array.isArray(value)
            ? ('rich' as const)
            : ('text' as const),
      value,
      binding: id,
    })),
    sections,
    templateData: mapped.invitation.templateData as Record<string, unknown>,
    customText: (mapped.invitation.customText ?? {}) as Record<string, unknown>,
    guests: [],
    openRsvp: mapped.invitation.openRsvp,
    theme,
  };

  return syncDocumentStateIntoTemplateData(document);
}
