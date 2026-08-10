/**
 * HTML-template editor — Zod validation schemas.
 *
 * Two schemas:
 *   - htmlEditorFieldsSchema: input validation (what API/redux sends)
 *   - htmlEditorFieldsOutputSchema: output type (what the editor state holds)
 *
 * The raw schema has superRefine hooks for URL/media validation.
 * z.input strips those hooks and returns plain inferred types.
 */

import { z } from 'zod';
import { isValidMapUrl } from '@/lib/shared/map-url';
import { parseUserMediaUrl } from '@/lib/uploads/media-url';
import type { AnimationType, HtmlEditorFields, RsvpFields } from './types';

// ─── Slug ────────────────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .min(2, 'Минимум 2 символа')
  .max(80, 'Максимум 80 символов')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Только латинские буквы, цифры и дефис'
  );

// ─── Animation types ────────────────────────────────────────────────────────

const ANIMATION_TYPE_LITERALS = [
  'none', 'fade-in', 'slide-left', 'slide-right', 'slide-up',
  'slide-down', 'zoom-in', 'bounce-in', 'rotate-in', 'spin',
  'pulse', 'shake', 'wobble', 'heartbeat', 'float', 'sway',
] as const;

// ─── Raw schema (with superRefine hooks) ─────────────────────────────────────

const _rawSchema = z.object({
  groomName: z.string().min(1, 'Имена обязательны').max(120),
  brideName: z.string().min(1, 'Имена обязательны').max(120),
  eventDate: z.string().min(1, 'Дата обязательна').max(10),
  eventTime: z.string().max(5).optional().or(z.literal('')),
  eventPlace: z.string().max(300).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  greeting: z.string().max(1000).optional().or(z.literal('')),
  mapUrl: z.string().max(300).optional().or(z.literal(''))
    .superRefine((val, ctx) => {
      if (!val) return;
      if (!isValidMapUrl(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только ссылки 2GIS, Google Maps или Yandex Maps',
        });
      }
    }),
  whatsappPhone: z.string().max(30).optional().or(z.literal('')),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Неверный формат').optional().or(z.literal('')),
  accentColorMode: z.enum(['default', 'custom']),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Неверный формат').optional().or(z.literal('')),
  animationType: z.enum(ANIMATION_TYPE_LITERALS),
  animationDuration: z.number().min(1).max(8),
  autoScroll: z.boolean(),
  showEnvelope: z.boolean(),
  fontMode: z.enum(['template', 'custom']),
  fontFamily: z.string().max(100).optional().or(z.literal('')),
  newTextFontMode: z.enum(['environment', 'custom']),
  newTextFontFamily: z.string().max(100).optional().or(z.literal('')),
  musicUrl: z.string().max(500).optional().or(z.literal(''))
    .superRefine((val, ctx) => {
      if (!val) return;
      try { parseUserMediaUrl(val); } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только файлы, загруженные через сервис',
        });
      }
    }),
  musicStartSec: z.number().min(0),
  musicEndSec: z.number().min(1),
  galleryPhotos: z.array(z.string().max(500)).max(8),
  cardTitle: z.string().max(200).optional().or(z.literal('')),
  cardDescription: z.string().max(500).optional().or(z.literal('')),
  cardImageUrl: z.string().max(500).optional().or(z.literal('')),
  slug: z.string().min(2).max(80).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Только латинские буквы, цифры и дефис'
  ),
  locale: z.enum(['kz', 'ru']),
});

export const htmlEditorFieldsSchema = _rawSchema;
export type HtmlEditorFieldsInput = z.infer<typeof htmlEditorFieldsSchema>;

/** Zod-validated version of HtmlEditorFields — use for store/DB. */
export type ValidatedHtmlEditorFields = HtmlEditorFields;

// ─── Partial schema (for live field-level validation) ─────────────────────────

export const htmlEditorPatchSchema = htmlEditorFieldsSchema.partial();

// ─── RSVP schema ────────────────────────────────────────────────────────────

export const rsvpFieldsSchema: z.ZodType<RsvpFields> = z.object({
  showPhone: z.boolean(),
  showGuestCount: z.boolean(),
  showWishes: z.boolean(),
});

// ─── Slug availability check ──────────────────────────────────────────────────

export interface SlugAvailabilityResult {
  available: boolean;
  takenBy?: string;
}

// ─── Field-level errors ───────────────────────────────────────────────────────

export type FieldErrors = Partial<Record<keyof HtmlEditorFields, string>>;

/** Validate a partial set of fields, return field-level error map. */
export function validateFields(data: Partial<HtmlEditorFields>): FieldErrors {
  const result = htmlEditorPatchSchema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof HtmlEditorFields;
    if (key && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
