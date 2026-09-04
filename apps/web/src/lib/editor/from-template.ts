/**
 * Server-side helper for creating a fresh editor draft from a template.
 * Used by /api/editor/from-template (Route Handler), which is POSTed by
 * <EditorBootstrap /> from the browser (so the session cookie is attached —
 * calling this from a server component directly would still work since it's
 * a plain function, but the route exists for the client-side POST + redirect
 * dance described in /editor/[templateKey]/page.tsx).
 *
 * This used to also *reuse* an existing draft via a 30-day
 * `editor:inv:{templateKey}` cookie, so that opening the same template
 * twice from the catalog picked up wherever you left off. That's not what
 * "catalog → editor" should do — "continue editing" already exists via the
 * dashboard's explicit `?id=<invitationId>` links, which don't go through
 * this function at all. Every call here now always creates a brand-new
 * draft; see /editor/[templateKey]/page.tsx for the full reasoning.
 */
import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { buildDefaultInvitationCanvas } from '@/lib/canvas/default-document';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';
import { deriveInvitationFieldsFromCanvas } from '@/lib/canvas/derive-invitation-fields';

export async function createDraftForTemplate(templateKey: string): Promise<
  { invitationId: string } | { error: 'template_not_found' | 'unauthorized' }
> {
  const template = await resolveTemplateBySlug(templateKey);
  if (!template) return { error: 'template_not_found' };

  const session = await getCurrentSession();
  if (!session) return { error: 'unauthorized' };

  /*
   * Reuse an untouched draft for this same template instead of minting another.
   *
   * The catalog card links straight here, and this function used to create a
   * row unconditionally — so opening a template, going back, and opening it
   * again left two identical drafts on the dashboard, and browsing the
   * catalogue left one per template looked at. "Untouched" is deliberately
   * strict: still a draft, no guests, no orders, and never saved since it was
   * created (updatedAt within a second of createdAt, which is what an
   * unmodified row looks like — the editor's autosave bumps updatedAt on the
   * first change). Anything the customer has actually worked on is left alone.
   */
  const untouched = await prisma.invitation.findFirst({
    where: {
      userId: session.user.id,
      templateKey: template.slug,
      status: 'draft',
      guests: { none: {} },
      orders: { none: {} },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, updatedAt: true },
  });
  if (untouched && untouched.updatedAt.getTime() - untouched.createdAt.getTime() < 1000) {
    return { invitationId: untouched.id };
  }

  const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const id = nanoid(10);
  const slug = `draft-${id}`;
  // BUG (found 2026-08-26): this used to always call
  // buildDefaultInvitationCanvas() here, completely ignoring the picked
  // template's own design — resolveTemplateBySlug didn't even select
  // `canvas`. Every "start editing" click from the catalog, regardless of
  // which template was chosen, silently produced the same generic starter
  // document. Now: seed from the template's real canvas when it has one
  // (isCanvasTemplate), falling back to the generic builder only for
  // legacy/html-engine templates that were never migrated to canvas.
  const document =
    template.isCanvasTemplate && template.canvas
      ? parseCanvasOrEmpty(template.canvas)
      : buildDefaultInvitationCanvas({ locale: 'ru', eventDate });

  // The title used to be `template.nameRu`, so a fresh draft showed up on the
  // dashboard as "Дала" or "Ақ бата" — the name of the *template*, not of the
  // event. It only became something meaningful after the first canvas save,
  // because that is when deriveInvitationFieldsFromCanvas runs. The template's
  // own canvas already carries the couple-names element, so derive from it up
  // front and keep the template name only as a last resort.
  const derived = deriveInvitationFieldsFromCanvas(document);
  const title = derived.title ?? template.nameRu;
  // Same reasoning for the date: the canvas the user is about to open shows the
  // template's demo date, so storing "today + 30 days" here made the dashboard
  // and the .ics export disagree with the page itself until the first save.
  const seedEventDate = derived.eventDate ?? eventDate;
  const seedEventTime = derived.eventTime ?? null;

  let invitationId: string | null = null;
  for (let attempts = 0; attempts < 3 && !invitationId; attempts += 1) {
    try {
      const inv = await prisma.invitation.create({
        data: {
          userId: session.user.id,
          title,
          slug,
          eventType: 'wedding',
          eventDate: seedEventDate,
          eventTime: seedEventTime,
          eventPlace: derived.eventPlace ?? null,
          address: derived.address ?? null,
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

  return { invitationId };
}
