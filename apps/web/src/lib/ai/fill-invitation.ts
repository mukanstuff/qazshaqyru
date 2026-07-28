import { z } from 'zod';

export const aiFillInputSchema = z.object({
  eventType: z.string().min(1).max(50),
  names: z.string().min(1).max(200),
  tone: z.enum(['warm', 'formal', 'playful', 'traditional']).default('warm'),
  language: z.enum(['ru', 'kz', 'both']).default('both'),
  venue: z.string().max(200).optional(),
  extra: z.string().max(500).optional(),
});

export type AiFillInput = z.infer<typeof aiFillInputSchema>;

export const aiFillOutputSchema = z.object({
  bodyRu: z.string().max(2000).optional(),
  bodyKz: z.string().max(2000).optional(),
  /** Hosts / parents line under names. */
  hostsLine: z.string().max(500).optional(),
  /** Short RSVP intro above the form. */
  rsvpIntro: z.string().max(500).optional(),
  dressCode: z.string().max(200).optional(),
  whatsappMessage: z.string().max(500).optional(),
  greeting: z.string().max(500).optional(),
  program: z
    .array(
      z.object({
        time: z.string().max(20),
        title: z.string().max(200),
        description: z.string().max(500).optional(),
      })
    )
    .max(12)
    .optional(),
});

export type AiFillOutput = z.infer<typeof aiFillOutputSchema>;

/** Deterministic offline fallback when AI_API_KEY is missing (dev / tests). */
export function buildAiFillFallback(input: AiFillInput): AiFillOutput {
  const toneRu =
    input.tone === 'formal'
      ? 'Имеем честь пригласить вас'
      : input.tone === 'playful'
        ? 'С радостью зовём вас'
        : input.tone === 'traditional'
          ? 'Приглашаем вас разделить с нами радость'
          : 'От всего сердца приглашаем вас';

  const venue = input.venue ? ` Место: ${input.venue}.` : '';
  const bodyRu = `${toneRu} на торжество ${input.names}.${venue} Будем счастливы видеть вас среди гостей.`;
  const bodyKz = `${input.names} тойына шақырамыз.${venue ? ` Орны: ${input.venue}.` : ''} Сіздерді көргенімізге қуаныштымыз.`;

  return {
    bodyRu: input.language === 'kz' ? undefined : bodyRu,
    bodyKz: input.language === 'ru' ? undefined : bodyKz,
    hostsLine: `Семья ${input.names}`,
    rsvpIntro:
      input.language === 'kz'
        ? 'Қатысуыңызды растаңыз'
        : 'Подтвердите, пожалуйста, присутствие',
    dressCode: input.tone === 'formal' ? 'Вечерний дресс-код' : 'Свободный элегантный стиль',
    whatsappMessage: `Сәлем! Шақыру: ${input.names}. Сілтеме: {link}`,
    greeting: `Дорогие гости!`,
    program: [
      { time: '16:00', title: 'Сбор гостей', description: 'Встреча и фото' },
      { time: '17:00', title: 'Торжественная часть' },
      { time: '18:00', title: 'Банкет' },
    ],
  };
}

export function getAiApiConfig(env: Partial<NodeJS.ProcessEnv> = process.env): {
  apiKey: string | null;
  baseUrl: string;
  model: string;
} {
  const apiKey = env.AI_API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || null;
  const baseUrl = (env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.AI_MODEL?.trim() || 'gpt-4o-mini';
  return { apiKey, baseUrl, model };
}

/**
 * Call OpenAI-compatible chat completions for structured invitation fill.
 * Falls back to local templates when no API key.
 */
export async function fillInvitationFields(
  input: AiFillInput,
  env: Partial<NodeJS.ProcessEnv> = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<{ data: AiFillOutput; source: 'ai' | 'fallback' }> {
  const parsed = aiFillInputSchema.parse(input);
  const { apiKey, baseUrl, model } = getAiApiConfig(env);

  if (!apiKey) {
    return { data: buildAiFillFallback(parsed), source: 'fallback' };
  }

  const system = `You fill wedding/toi invitation fields for Kazakhstan (RU/KZ).
Return ONLY valid JSON matching keys: bodyRu, bodyKz, hostsLine, rsvpIntro, dressCode, whatsappMessage, greeting, program[{time,title,description}].
No markdown. Keep texts warm, short, culturally appropriate. Do not invent payment or Kaspi details.`;

  const user = JSON.stringify(parsed);

  const res = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI provider error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    return { data: buildAiFillFallback(parsed), source: 'fallback' };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return { data: buildAiFillFallback(parsed), source: 'fallback' };
  }

  const out = aiFillOutputSchema.safeParse(raw);
  if (!out.success) {
    return { data: buildAiFillFallback(parsed), source: 'fallback' };
  }

  return { data: out.data, source: 'ai' };
}
