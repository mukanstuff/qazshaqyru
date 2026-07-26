import { z } from 'zod';

const programItemSchema = z.object({
  time: z.string().max(20),
  title: z.string().max(200),
  description: z.string().max(500).optional(),
});

/** Strict shape for Invitation.customText — prevents JSON bloat via API. */
export const customTextSchema = z
  .object({
    greeting: z.string().max(500).optional(),
    intro: z.string().max(1000).optional(),
    details: z.string().max(2000).optional(),
    closing: z.string().max(500).optional(),
    dressCode: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
    aboutCouple: z.string().max(2000).optional(),
    footer: z.string().max(500).optional(),
    program: z.array(programItemSchema).max(30).optional(),
    /** UI locale for the public invitation page (ru/kz). */
    invitationLocale: z.enum(['ru', 'kz']).optional(),
    /** Allow guests to RSVP without a personal link (phone required). */
    openRsvp: z.boolean().optional(),
    /** Kaspi phone for gift transfers (KZ format). */
    kaspiPhone: z.string().max(20).optional(),
    /** Public Instagram profile URL. */
    instagramUrl: z.string().max(300).optional(),
    /** Public Telegram channel/profile URL. */
    telegramUrl: z.string().max(300).optional(),
    /** SHA-256 hash of family preview token (draft sharing before payment). */
    familyPreviewTokenHash: z.string().max(128).optional(),
    /** Raw token for family preview link (draft sharing). */
    familyPreviewToken: z.string().max(128).optional(),
  })
  .strict();

export type CustomTextInput = z.infer<typeof customTextSchema>;

export function parseCustomTextInput(value: unknown): CustomTextInput {
  const result = customTextSchema.safeParse(value);
  if (!result.success) {
    throw new Error('Недопустимое содержимое приглашения');
  }
  return result.data;
}
