/**
 * Server-side helper for creating / reusing an editor draft.
 * Used by /api/editor/from-template (Route Handler) — the only place allowed
 * to call cookies().set() in Next 14.
 *
 * Why a helper instead of HTTP fetch: calling fetch('http://localhost:3000/api/...')
 * from a server component doesn't carry the session cookie and fails with 401.
 *
 * The /editor/[templateKey] page renders <EditorBootstrap /> which POSTs this
 * route from the browser (so the session cookie is attached) and router.replace
 * back to ?id=<draftUuid>.
 */
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { buildDefaultInvitationCanvas } from '@/lib/canvas/default-document';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';

export const COOKIE_PREFIX = 'editor:inv:';

export async function findOrCreateDraftForTemplate(templateKey: string): Promise<
  { invitationId: string; reused: boolean } | { error: 'template_not_found' | 'unauthorized' }
> {
  const template = await resolveTemplateBySlug(templateKey);
  if (!template) return { error: 'template_not_found' };

  const cookieStore = await cookies();
  const cookieKey = `${COOKIE_PREFIX}${templateKey}`;
  const existingId = cookieStore.get(cookieKey)?.value ?? null;

  // 1. Reuse existing draft if cookie points to a row we own.
  if (existingId) {
    const existing = await prisma.invitation.findUnique({
      where: { id: existingId },
      select: { id: true, userId: true, status: true },
    });
    if (existing) return { invitationId: existing.id, reused: true };
  }

  // 2. Auth required to create a new draft.
  const session = await getCurrentSession();
  if (!session) return { error: 'unauthorized' };

  // 3. Create draft + seed canvas.
  const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const id = nanoid(10);
  const slug = `draft-${id}`;
  const document = buildDefaultInvitationCanvas({ locale: 'ru', eventDate });

  let invitationId: string | null = null;
  for (let attempts = 0; attempts < 3 && !invitationId; attempts += 1) {
    try {
      const inv = await prisma.invitation.create({
        data: {
          userId: session.user.id,
          title: template.nameRu,
          slug,
          eventType: 'wedding',
          eventDate,
          eventTimezone: 'Asia/Almaty',
          templateKey: template.slug,
          templateId: template.id.startsWith('html:') ? null : template.id,
          status: 'draft',
          canvas: document as unknown as object,
        },
        select: { id: true },
      });
      invitationId = inv.id;
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code !== 'P2002') throw err;
    }
  }

  if (!invitationId) {
    throw new Error('failed to generate unique slug');
  }

  // Ensure canvas exists (template.canvas branch may differ from our seed).
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await ensureCanvasDocument(tx, invitationId!);
  });

  // 4. Set cookie so next visit to /editor/[templateKey] reuses the draft.
  cookieStore.set({
    name: cookieKey,
    value: invitationId,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return { invitationId, reused: false };
}
