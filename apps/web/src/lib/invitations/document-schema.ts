import { z } from 'zod';

const invitationFieldTypeSchema = z.enum(['text', 'image', 'rich', 'date', 'map', 'link']);

const sectionTypeSchema = z.enum([
  'envelope-intro',
  'hero-names',
  'body-invitation',
  'cover-photo',
  'calendar',
  'countdown',
  'venue-map',
  'rsvp',
  'wishes',
  'music',
  'dress-code',
  'gallery',
  'final-text',
  'kaspi',
  'program',
]);

export const invitationDocumentMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  eventType: z.string(),
  eventDate: z.string(),
  eventTime: z.string().nullable().optional(),
  eventPlace: z.string().nullable().optional(),
  eventTimezone: z.string(),
  address: z.string().nullable().optional(),
  mapUrl: z.string().nullable().optional(),
  musicUrl: z.string().nullable().optional(),
  language: z.enum(['kz', 'ru']),
  hostName: z.string().nullable().optional(),
  isPast: z.boolean(),
  templateKey: z.string(),
  templateId: z.string().optional(),
  status: z.string().optional(),
});

export const invitationDocumentFieldSchema = z.object({
  id: z.string(),
  type: invitationFieldTypeSchema,
  value: z.unknown(),
  locale: z.enum(['kz', 'ru']).optional(),
  binding: z.string(),
});

export const invitationDocumentSectionSchema = z.object({
  id: z.string(),
  type: sectionTypeSchema,
  visible: z.boolean(),
  order: z.number().int(),
  canHide: z.boolean(),
  canReorder: z.boolean(),
  bindings: z.record(z.string()),
  props: z.record(z.unknown()).optional(),
});

export const invitationDocumentGuestSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  side: z.string().nullable().optional(),
  hasPlusOne: z.boolean().optional(),
  plusOneName: z.string().nullable().optional(),
  responseStatus: z.string().nullable().optional(),
  sentAt: z.string().nullable().optional(),
});

export const invitationDocumentThemeSchema = z.object({
  accent: z.string(),
  textLight: z.string(),
  textDark: z.string(),
  fonts: z.object({
    display: z.string(),
    body: z.string(),
    label: z.string().optional(),
    ceremonial: z.string().optional(),
  }),
});

export const invitationDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  meta: invitationDocumentMetaSchema,
  fields: z.array(invitationDocumentFieldSchema),
  sections: z.array(invitationDocumentSectionSchema),
  templateData: z.record(z.unknown()),
  customText: z.record(z.unknown()),
  guests: z.array(invitationDocumentGuestSchema),
  openRsvp: z.boolean().optional(),
  theme: invitationDocumentThemeSchema.optional(),
});

export type InvitationDocumentParsed = z.infer<typeof invitationDocumentSchema>;

export function parseInvitationDocument(input: unknown): InvitationDocumentParsed {
  return invitationDocumentSchema.parse(input);
}

export function safeParseInvitationDocument(input: unknown) {
  return invitationDocumentSchema.safeParse(input);
}
