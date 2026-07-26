import { z } from 'zod';
import type { InvitationData } from '@/components/invitation-layouts/types';
import type { LocalDraft } from '@/lib/invitations/draft-storage';
import { eventTypeFromTemplateKey } from '@/lib/invitations/draft-storage';
import {
  DEFAULT_BODY_KZ,
  DEFAULT_BODY_RU,
  getFieldDefault,
  interpolateFieldTemplate,
  resolveManifestFields,
} from './manifest-fields';
import type { TemplateFieldDef, TemplateManifest } from './manifest-types';

export type ManifestFormValues = Record<string, string>;

const FIELD_MAX_LENGTH: Partial<Record<string, number>> = {
  groomName: 80,
  brideName: 80,
  hostsLine: 200,
  venueName: 300,
  venueAddress: 500,
  mapUrl: 500,
  bodyTextKz: 4000,
  bodyTextRu: 4000,
  coverPhoto: 500,
  dressCodeTitle: 120,
  dressCodeNote: 500,
  galleryPhoto1: 500,
  galleryPhoto2: 500,
  galleryPhoto3: 500,
  galleryPhoto4: 500,
  finalText: 500,
};

function requiredMessage(field: TemplateFieldDef, locale: 'kz' | 'ru'): string {
  const label = locale === 'kz' ? field.labelKz : field.labelRu;
  return locale === 'kz' ? `${label} міндетті` : `Укажите: ${label}`;
}

function zodForField(field: TemplateFieldDef, locale: 'kz' | 'ru'): z.ZodTypeAny {
  const maxLen = FIELD_MAX_LENGTH[field.key] ?? (field.type === 'textarea' ? 4000 : 300);

  switch (field.type) {
    case 'text':
    case 'textarea': {
      let schema = z.string().max(maxLen);
      if (field.required) {
        schema = schema.min(1, requiredMessage(field, locale));
      }
      return field.required ? schema : schema.optional().or(z.literal(''));
    }
    case 'date': {
      const schema = z.string().min(1, requiredMessage(field, locale));
      return field.required ? schema : schema.optional().or(z.literal(''));
    }
    case 'time': {
      const schema = z.string().max(20);
      return field.required
        ? schema.min(1, requiredMessage(field, locale))
        : schema.optional().or(z.literal(''));
    }
    case 'url': {
      return z.string().max(maxLen).superRefine((value, ctx) => {
        const v = value ?? '';
        if (field.required && !v.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: requiredMessage(field, locale) });
          return;
        }
        if (v && !/^https?:\/\//i.test(v)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: locale === 'kz' ? 'Дұрыс сілтеме енгізіңіз' : 'Введите корректную ссылку',
          });
        }
      });
    }
    case 'image': {
      return z.string().max(maxLen).optional().or(z.literal(''));
    }
    default:
      return z.string().optional().or(z.literal(''));
  }
}

export function buildManifestFormSchema(manifest: TemplateManifest, locale: 'kz' | 'ru') {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of manifest.fields) {
    shape[field.key] = zodForField(field, locale);
  }
  return z.object(shape);
}

export function validateManifestForm(
  manifest: TemplateManifest,
  values: ManifestFormValues,
  locale: 'kz' | 'ru',
): { success: true; data: ManifestFormValues } | { success: false; errors: Record<string, string> } {
  const schema = buildManifestFormSchema(manifest, locale);
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data as ManifestFormValues };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? 'form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

export function buildInvitationTitle(brideName: string, groomName: string): string {
  const bride = brideName.trim();
  const groom = groomName.trim();
  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || '';
}

function defaultEventDateIso(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function requiredFieldFallback(key: string, locale: 'kz' | 'ru'): string {
  const fallbacks: Record<string, { kz: string; ru: string }> = {
    venueName: {
      kz: 'Мейрамхана «Жарық»',
      ru: 'Ресторан «Жарық»',
    },
    venueAddress: {
      kz: 'г. Алматы',
      ru: 'г. Алматы',
    },
  };
  return fallbacks[key]?.[locale] ?? '';
}

/** Default quick-edit form values from manifest field defs. */
export function buildDefaultManifestFormValues(
  manifest: TemplateManifest,
  locale: 'kz' | 'ru',
): ManifestFormValues {
  const groomName =
    getFieldDefault(manifest, 'groomName', locale) ??
    (locale === 'kz' ? 'Нұрлан' : 'Нурлан');
  const brideName =
    getFieldDefault(manifest, 'brideName', locale) ??
    (locale === 'kz' ? 'Айгерім' : 'Айгерим');

  const values: ManifestFormValues = {
    groomName,
    brideName,
  };

  for (const field of manifest.fields) {
    if (field.key === 'groomName' || field.key === 'brideName') continue;
    if (field.key === 'bodyTextKz') {
      values.bodyTextKz = interpolateFieldTemplate(DEFAULT_BODY_KZ, { groomName, brideName });
      continue;
    }
    if (field.key === 'eventDate') {
      values.eventDate = defaultEventDateIso();
      continue;
    }
    const explicit = getFieldDefault(manifest, field.key, locale);
    if (explicit !== undefined) {
      values[field.key] = explicit;
    } else if (field.required) {
      values[field.key] = requiredFieldFallback(field.key, locale);
    } else {
      values[field.key] = '';
    }
  }

  if (!values.bodyTextRu) {
    values.bodyTextRu = interpolateFieldTemplate(DEFAULT_BODY_RU, { groomName, brideName });
  }

  return values;
}

export interface MapManifestOptions {
  templateKey: string;
  templateId: string;
  templateName: string;
  locale: 'kz' | 'ru';
  serverInvitationId?: string;
}

export interface MappedManifestInvitation {
  invitation: InvitationData;
  draft: LocalDraft;
}

function normalizeEventDate(value: string): string {
  if (!value) return new Date().toISOString();
  if (value.includes('T')) return value;
  return new Date(`${value}T12:00:00`).toISOString();
}

/** Manifest form values → InvitationData preview + LocalDraft for save/publish. */
export function mapManifestFieldsToInvitation(
  formValues: ManifestFormValues,
  manifest: TemplateManifest,
  options: MapManifestOptions,
): MappedManifestInvitation {
  const groomName = formValues.groomName?.trim() ?? '';
  const brideName = formValues.brideName?.trim() ?? '';
  const title = buildInvitationTitle(brideName, groomName) || options.templateName;
  const locale = options.locale;

  const bodyTextKz =
    formValues.bodyTextKz?.trim() ||
    interpolateFieldTemplate(DEFAULT_BODY_KZ, { groomName, brideName });
  const bodyTextRu =
    formValues.bodyTextRu?.trim() ||
    interpolateFieldTemplate(DEFAULT_BODY_RU, { groomName, brideName });

  const customText: Record<string, unknown> = {
    groomName,
    brideName,
    hostsLine:
      formValues.hostsLine?.trim() ||
      (locale === 'kz' ? 'Құрметпен, той иелері:' : 'С уважением, семья молодых:'),
    bodyTextKz,
    bodyTextRu,
    dressCodeTitle: formValues.dressCodeTitle?.trim() || '',
    dressCodeNote: formValues.dressCodeNote?.trim() || '',
    finalText: formValues.finalText?.trim() || '',
    invitationLocale: locale,
  };

  const templateData: Record<string, unknown> = {};
  if (formValues.coverPhoto?.trim()) {
    templateData.coverPhoto = formValues.coverPhoto.trim();
  }
  for (const key of ['galleryPhoto1', 'galleryPhoto2', 'galleryPhoto3', 'galleryPhoto4'] as const) {
    if (formValues[key]?.trim()) {
      templateData[key] = formValues[key]!.trim();
    }
  }

  const eventDate = normalizeEventDate(formValues.eventDate ?? '');
  const eventTime = formValues.eventTime?.trim() || null;

  const invitation: InvitationData = {
    id: options.serverInvitationId ?? 'draft',
    slug: 'draft',
    title,
    eventType: eventTypeFromTemplateKey(options.templateKey),
    eventDate,
    eventTime,
    eventPlace: formValues.venueName?.trim() || null,
    eventTimezone: 'Asia/Almaty',
    templateKey: options.templateKey,
    templateData,
    musicUrl: null,
    mapUrl: formValues.mapUrl?.trim() || null,
    address: formValues.venueAddress?.trim() || null,
    customText,
    language: locale,
    hostName: null,
    isPast: false,
    openRsvp: true,
  };

  const draft: LocalDraft = {
    templateKey: options.templateKey,
    templateId: options.templateId,
    serverInvitationId: options.serverInvitationId,
    title,
    eventType: invitation.eventType,
    eventDate,
    eventTime,
    eventPlace: invitation.eventPlace,
    address: invitation.address,
    mapUrl: invitation.mapUrl,
    musicUrl: null,
    templateData,
    customText,
    guests: [],
    eventTimezone: 'Asia/Almaty',
    language: locale,
    fromWizard: true,
    updatedAt: new Date().toISOString(),
  };

  return { invitation, draft };
}

/** Invitation DB record → manifest form values (edit mode). */
export function invitationToManifestFormValues(invitation: InvitationData): ManifestFormValues {
  return resolveManifestFields(invitation);
}

export function getManifestFieldLabel(
  field: TemplateFieldDef,
  locale: 'kz' | 'ru',
): string {
  return locale === 'kz' ? field.labelKz : field.labelRu;
}
