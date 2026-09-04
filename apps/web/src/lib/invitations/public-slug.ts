import type { Prisma } from '@prisma/client';

/** Path segments a public slug must never shadow. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'dashboard',
  'demo',
  'i',
  'login',
  'r',
  'templates',
  'settings',
  'blog',
  'mock-payment',
  'new',
  'edit',
]);

/**
 * Turns an invitation title into the public URL slug.
 *
 * Drafts are created as `draft-<nanoid>` and, until now, kept that slug forever:
 * publishing changed only `status`. So the link a customer sent to their guests
 * in WhatsApp read `qazshaqyru.kz/i/draft-qQXjHWC6so` — the word "draft" and a
 * random id on the one artefact the whole product exists to hand out. Renaming
 * the link was possible, but only behind the paid `fullAccess` gate, so free
 * publishes had no way out of it at all.
 *
 * A readable slug is not a premium feature; *choosing* it is. Publishing now
 * derives one from the couple's names, and the paid editor still lets you set
 * your own.
 */

/** Kazakh + Russian Cyrillic → latin. Order matters: digraphs before letters. */
const TRANSLIT: Record<string, string> = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e',
  ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n',
  ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u',
  ү: 'u', ф: 'f', х: 'h', һ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Words that carry no meaning in a URL — the "&"/"и"/"және" between names. */
const STOP_WORDS = new Set(['and', 'i', 'zhane', 'jane', 've']);

export function slugifyTitle(title: string): string {
  const latin = [...title.toLowerCase()]
    .map((ch) => {
      if (TRANSLIT[ch] !== undefined) return TRANSLIT[ch];
      if (/[a-z0-9]/.test(ch)) return ch;
      return ' ';
    })
    .join('');

  const words = latin
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOP_WORDS.has(w));

  return words.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

/**
 * A readable, unique slug for `title`. Falls back to `fallback` (the existing
 * draft slug) when the title transliterates to nothing usable — a title made
 * only of emoji or punctuation, for instance.
 */
export async function buildPublicSlug(
  tx: Prisma.TransactionClient,
  title: string,
  fallback: string,
  reserved: ReadonlySet<string>
): Promise<string> {
  const base = slugifyTitle(title);
  // `min(3)` matches the manual slug editor's own validation.
  if (base.length < 3 || reserved.has(base)) return fallback;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await tx.invitation.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return fallback;
}

/** Slug shapes that were auto-generated and are safe to replace on publish. */
export function isGeneratedDraftSlug(slug: string): boolean {
  return /^draft-[A-Za-z0-9_-]+$/.test(slug);
}
