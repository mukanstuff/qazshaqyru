import type { InvitationData } from '@/components/invitation-layouts/types';
import type { InvitationForEditor } from '@/components/editor/EditorLayout.types';
import type { LocalDraft, LocalDraftGuest } from '@/lib/invitations/draft-storage';
import type { TemplateManifest, TemplateSection } from '@/lib/templates/manifest-types';
import { getTemplateManifest } from '@/lib/templates/manifests';
import {
  readDocumentState,
  resolveSectionsFromManifest,
  syncDocumentStateIntoTemplateData,
} from '@/lib/invitations/document-state';

export type InvitationFieldType = 'text' | 'image' | 'rich' | 'date' | 'map' | 'link';

export interface InvitationDocumentMeta {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime?: string | null;
  eventPlace?: string | null;
  eventTimezone: string;
  address?: string | null;
  mapUrl?: string | null;
  musicUrl?: string | null;
  language: 'kz' | 'ru';
  hostName?: string | null;
  isPast: boolean;
  templateKey: string;
  templateId?: string;
  status?: string;
}

export interface InvitationDocumentField {
  id: string;
  type: InvitationFieldType;
  value: unknown;
  locale?: 'kz' | 'ru';
  binding: string;
}

export interface InvitationDocumentSection {
  id: string;
  type: TemplateSection['type'];
  visible: boolean;
  order: number;
  canHide: boolean;
  canReorder: boolean;
  bindings: Record<string, string>;
  props?: Record<string, unknown>;
}

export interface InvitationDocumentGuest {
  id: string;
  name: string;
  phone?: string | null;
  side?: string | null;
  hasPlusOne?: boolean;
  plusOneName?: string | null;
  householdLabel?: string | null;
  responseStatus?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
}

export interface InvitationDocumentTheme {
  accent: string;
  textLight: string;
  textDark: string;
  fonts: {
    display: string;
    body: string;
    label?: string;
    ceremonial?: string;
  };
}

export interface InvitationDocument {
  schemaVersion: 1;
  meta: InvitationDocumentMeta;
  fields: InvitationDocumentField[];
  sections: InvitationDocumentSection[];
  templateData: Record<string, unknown>;
  customText: Record<string, unknown>;
  guests: InvitationDocumentGuest[];
  openRsvp?: boolean;
  theme?: InvitationDocumentTheme;
}

function buildFields(
  templateData: Record<string, unknown>,
  customText: Record<string, unknown>,
): InvitationDocumentField[] {
  const templateFields = Object.entries(templateData)
    .filter(([key]) => key !== '__documentState')
    .map(([key, value]) => ({
      id: `templateData.${key}`,
      type:
        typeof value === 'string' && /^https?:\/\//i.test(value)
          ? ('image' as const)
          : ('text' as const),
      value,
      binding: `templateData.${key}`,
    }));

  const customFields = Object.entries(customText).map(([key, value]) => ({
    id: `customText.${key}`,
    type: Array.isArray(value) ? ('rich' as const) : ('text' as const),
    value,
    binding: `customText.${key}`,
  }));

  return [...templateFields, ...customFields];
}

function buildSections(
  templateKey: string,
  templateData: Record<string, unknown>,
): InvitationDocumentSection[] {
  const manifest: TemplateManifest | null = getTemplateManifest(templateKey);
  if (!manifest) return [];
  return resolveSectionsFromManifest(manifest, templateData);
}

function resolveTheme(
  templateKey: string,
  templateData: Record<string, unknown>,
): InvitationDocumentTheme | undefined {
  const manifest = getTemplateManifest(templateKey);
  const saved = readDocumentState(templateData);
  if (saved?.theme) return saved.theme;
  if (!manifest) return undefined;
  return { ...manifest.theme };
}

/**
 * Build normalized editor/public document from persisted invitation record.
 */
export function invitationForEditorToDocument(invitation: InvitationForEditor): InvitationDocument {
  const templateData = invitation.templateData as Record<string, unknown>;
  const customText = invitation.customText as Record<string, unknown>;
  const document: InvitationDocument = {
    schemaVersion: 1,
    meta: {
      id: invitation.id,
      slug: invitation.slug,
      title: invitation.title,
      eventType: invitation.eventType,
      eventDate: invitation.eventDate,
      eventTime: invitation.eventTime ?? null,
      eventPlace: invitation.eventPlace ?? null,
      eventTimezone: invitation.eventTimezone,
      address: invitation.address ?? null,
      mapUrl: invitation.mapUrl ?? null,
      musicUrl: invitation.musicUrl ?? null,
      language: invitation.language,
      hostName: invitation.hostName ?? null,
      isPast: invitation.isPast,
      templateKey: invitation.templateKey,
      status: invitation.status,
    },
    fields: buildFields(templateData, customText),
    sections: buildSections(invitation.templateKey, templateData),
    templateData,
    customText,
    guests: invitation.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      side: guest.side,
      hasPlusOne: guest.hasPlusOne,
      plusOneName: guest.plusOneName,
      responseStatus: guest.responseStatus ?? null,
      sentAt: guest.sentAt ?? null,
    })),
    theme: resolveTheme(invitation.templateKey, templateData),
  };
  return document;
}

/**
 * Build normalized document for anonymous/local draft flow.
 */
export function localDraftToDocument(draft: LocalDraft): InvitationDocument {
  const document: InvitationDocument = {
    schemaVersion: 1,
    meta: {
      id: draft.serverInvitationId ?? 'draft',
      slug: draft.serverInvitationId ?? 'draft',
      title: draft.title,
      eventType: draft.eventType,
      eventDate: draft.eventDate,
      eventTime: draft.eventTime ?? null,
      eventPlace: draft.eventPlace ?? null,
      eventTimezone: draft.eventTimezone,
      address: draft.address ?? null,
      mapUrl: draft.mapUrl ?? null,
      musicUrl: draft.musicUrl ?? null,
      language: draft.language,
      hostName: null,
      isPast: false,
      templateKey: draft.templateKey,
      templateId: draft.templateId,
      status: 'draft',
    },
    fields: buildFields(draft.templateData, draft.customText),
    sections: buildSections(draft.templateKey, draft.templateData),
    templateData: draft.templateData,
    customText: draft.customText,
    guests: draft.guests.map((guest) => ({
      id: guest.localId,
      name: guest.name,
      phone: guest.phone,
      hasPlusOne: guest.hasPlusOne,
    })),
    theme: resolveTheme(draft.templateKey, draft.templateData),
  };
  return document;
}

/**
 * Editor/public renderer still consumes legacy `InvitationData`.
 */
export function documentToInvitationData(document: InvitationDocument): InvitationData {
  const synced = syncDocumentStateIntoTemplateData(document);
  return {
    id: synced.meta.id,
    slug: synced.meta.slug,
    title: synced.meta.title,
    eventType: synced.meta.eventType,
    eventDate: synced.meta.eventDate,
    eventTime: synced.meta.eventTime ?? null,
    eventPlace: synced.meta.eventPlace ?? null,
    eventTimezone: synced.meta.eventTimezone,
    templateKey: synced.meta.templateKey,
    templateData: synced.templateData as InvitationData['templateData'],
    musicUrl: synced.meta.musicUrl ?? null,
    mapUrl: synced.meta.mapUrl ?? null,
    address: synced.meta.address ?? null,
    customText: synced.customText,
    language: synced.meta.language,
    hostName: synced.meta.hostName ?? null,
    isPast: synced.meta.isPast,
    openRsvp: synced.openRsvp,
  };
}

export function documentToLocalDraft(
  document: InvitationDocument,
  previousDraft: LocalDraft | null,
): LocalDraft {
  const synced = syncDocumentStateIntoTemplateData(document);
  const previousGuests = previousDraft?.guests ?? [];
  const guests: LocalDraftGuest[] = synced.guests.map((guest) => {
    const prev = previousGuests.find(
      (item) => item.localId === guest.id || item.serverGuestId === guest.id,
    );
    return {
      localId: prev?.localId ?? guest.id,
      serverGuestId: prev?.serverGuestId,
      name: guest.name,
      phone: guest.phone ?? undefined,
      hasPlusOne: guest.hasPlusOne,
    };
  });

  return {
    templateKey: synced.meta.templateKey,
    templateId: synced.meta.templateId,
    serverInvitationId:
      previousDraft?.serverInvitationId ??
      (synced.meta.id !== 'draft' ? synced.meta.id : undefined),
    title: synced.meta.title,
    eventType: synced.meta.eventType,
    eventDate: synced.meta.eventDate,
    eventTime: synced.meta.eventTime ?? null,
    eventPlace: synced.meta.eventPlace ?? null,
    address: synced.meta.address ?? null,
    mapUrl: synced.meta.mapUrl ?? null,
    musicUrl: synced.meta.musicUrl ?? null,
    templateData: synced.templateData,
    customText: synced.customText,
    guests,
    eventTimezone: synced.meta.eventTimezone,
    language: synced.meta.language,
    updatedAt: new Date().toISOString(),
    fromWizard: previousDraft?.fromWizard,
  };
}

export function documentToInvitationForEditor(
  document: InvitationDocument,
  previous: InvitationForEditor,
): InvitationForEditor {
  const synced = syncDocumentStateIntoTemplateData(document);
  return {
    ...previous,
    id: synced.meta.id,
    slug: synced.meta.slug,
    status: synced.meta.status ?? previous.status,
    title: synced.meta.title,
    eventType: synced.meta.eventType,
    eventDate: synced.meta.eventDate,
    eventTime: synced.meta.eventTime ?? null,
    eventPlace: synced.meta.eventPlace ?? null,
    address: synced.meta.address ?? null,
    mapUrl: synced.meta.mapUrl ?? null,
    musicUrl: synced.meta.musicUrl ?? null,
    templateKey: synced.meta.templateKey,
    templateData: synced.templateData,
    customText: synced.customText,
    guests: synced.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      phone: guest.phone ?? null,
      side: guest.side ?? null,
      hasPlusOne: guest.hasPlusOne ?? false,
      plusOneName: guest.plusOneName ?? null,
      sentAt: guest.sentAt ?? null,
      responseStatus: guest.responseStatus ?? null,
    })),
    eventTimezone: synced.meta.eventTimezone,
    language: synced.meta.language,
    hostName: synced.meta.hostName ?? null,
    isPast: synced.meta.isPast,
  };
}
