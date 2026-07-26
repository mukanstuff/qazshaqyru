import { z } from 'zod';
import { parseUserMediaUrl, parseTemplateMediaUrl } from '@/lib/uploads/media-url';

function mediaUrlField() {
  return z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (!val) return;
      try {
        parseTemplateMediaUrl(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Разрешены только загруженные файлы или стандартные изображения шаблона',
        });
      }
    });
}

/** Validates known media fields in templateData; unknown keys pass through. */
export const templateDataSchema: z.ZodType<Record<string, unknown>> = z
  .object({
    primaryColor: z.string().max(20).optional(),
    secondaryColor: z.string().max(20).optional(),
    fontFamily: z.string().max(100).optional(),
    backgroundImage: mediaUrlField(),
    coverPhoto: mediaUrlField(),
    couplePhoto1: mediaUrlField(),
    couplePhoto2: mediaUrlField(),
    galleryPhoto1: mediaUrlField(),
    galleryPhoto2: mediaUrlField(),
    galleryPhoto3: mediaUrlField(),
    galleryPhoto4: mediaUrlField(),
  })
  .catchall(z.unknown());

export function parseTemplateDataInput(value: unknown): Record<string, unknown> {
  const result = templateDataSchema.safeParse(value ?? {});
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Недопустимые данные шаблона';
    throw new Error(msg);
  }
  return result.data;
}
