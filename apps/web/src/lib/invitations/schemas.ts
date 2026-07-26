import { z } from 'zod';

import { EVENT_TYPES } from '@/lib/shared/types';
import { customTextSchema } from '@/lib/shared/custom-text-schema';
import { templateDataSchema } from '@/lib/templates/template-data-schema';
import { isValidMapUrl, parseMapUrl } from '@/lib/shared/map-url';
import { parseUserMediaUrl } from '@/lib/uploads/media-url';

export const eventTypeSchema = z.enum(EVENT_TYPES);

export const invitationCreateBodySchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  eventType: eventTypeSchema,
  eventDate: z.string().transform((str, ctx) => {
    const date = new Date(str);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Некорректная дата' });
      return z.NEVER;
    }
    return date;
  }),
  eventTime: z.string().max(20).optional(),
  eventPlace: z.string().max(300).optional(),
  eventTimezone: z.string().max(50).default('Asia/Almaty'),
  templateId: z.string().uuid(),
  templateKey: z.string().max(50),
  templateData: templateDataSchema.optional(),
  musicUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (!val) return;
      try {
        parseUserMediaUrl(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только файлы, загруженные через сервис',
        });
      }
    }),
  mapUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (!val) return;
      if (!isValidMapUrl(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только ссылки 2GIS, Google Maps или Yandex Maps',
        });
      }
    }),
  address: z.string().max(500).optional(),
  customText: customTextSchema.optional(),
});

export const invitationUpdateBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  eventType: eventTypeSchema.optional(),
  eventDate: z
    .string()
    .transform((str, ctx) => {
      const date = new Date(str);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Некорректная дата' });
        return z.NEVER;
      }
      return date;
    })
    .optional(),
  eventTime: z.string().max(20).nullable().optional(),
  eventPlace: z.string().max(300).nullable().optional(),
  eventTimezone: z.string().max(50).optional(),
  templateId: z.string().uuid().nullable().optional(),
  templateKey: z.string().max(50).optional(),
  templateData: templateDataSchema.optional(),
  musicUrl: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (val === undefined || val === null || val === '') return;
      try {
        parseUserMediaUrl(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только файлы, загруженные через сервис',
        });
      }
    }),
  mapUrl: z
    .string()
    .nullable()
    .optional()
    .superRefine((val, ctx) => {
      if (val === undefined || val === null || val.trim() === '') return;
      if (!isValidMapUrl(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только ссылки 2GIS, Google Maps или Yandex Maps',
        });
      }
    }),
  address: z.string().max(500).nullable().optional(),
  customText: customTextSchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const invitationUpdateDetailsActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  eventType: eventTypeSchema,
  eventDate: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Некорректная дата'),
  eventTime: z.string().max(20).nullable(),
  eventPlace: z.string().max(300).nullable(),
  address: z.string().max(500).nullable(),
  mapUrl: z
    .string()
    .nullable()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === '') return null;
      return parseMapUrl(v);
    }),
  musicUrl: z
    .string()
    .nullable()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === '') return null;
      return parseUserMediaUrl(v);
    }),
});

export const invitationUpdateDesignActionSchema = z.object({
  id: z.string().uuid(),
  templateKey: z.string().max(50),
  templateData: z.record(z.unknown()),
});

export const invitationUpdateContentActionSchema = z.object({
  id: z.string().uuid(),
  customText: customTextSchema,
});

const guestSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  side: z.enum(['bride', 'groom']).optional(),
  hasPlusOne: z.boolean().default(false),
  plusOneName: z.string().max(100).optional(),
  householdLabel: z.string().max(100).optional(),
});

export const invitationAddGuestsActionSchema = z.object({
  invitationId: z.string().uuid(),
  guests: z.array(guestSchema).min(1).max(500),
});

export type InvitationCreateBody = z.infer<typeof invitationCreateBodySchema>;
export type InvitationUpdateBody = z.infer<typeof invitationUpdateBodySchema>;
