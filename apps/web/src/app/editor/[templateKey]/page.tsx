/**
 * /editor/[templateKey]
 *
 * Single-URL editor entry (toi.com.kz style):
 *   /templates → click template → /editor/[templateKey] (this page)
 *   → if ?id=<draftUuid> is present, renders editor immediately
 *   → otherwise renders <EditorBootstrap /> which POSTs /api/editor/from-template
 *     (server-side cookie set is forbidden from server components in Next 14),
 *     gets back the new draft id, and router.replace back to ?id=... so the
 *     editor renders on second pass.
 *
 * Back-compat: ?id=<invitationId> reuses an existing draft (used by
 * `/invitations/[id]/canvas` redirect chain and old bookmarks).
 *
 * No /invitations/{uuid}/canvas hop. URL stays /editor/[templateKey].
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { CanvasEditorClient } from '@/app/invitations/[id]/canvas/CanvasEditorClient';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { getI18n } from '@/i18n/server';
import { EditorBootstrap } from '@/components/editor/EditorBootstrap';
import { COOKIE_PREFIX } from '@/lib/editor/from-template';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ templateKey: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function TemplateEditorPage({ params, searchParams }: Props) {
  const { templateKey } = await params;
  const { id: forcedId } = await searchParams;

  // 1. Auth gate.
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/editor/${templateKey}`)}`);
  }

  // 2. Resolve template (DB or html-engine registry).
  const template = await resolveTemplateBySlug(templateKey);
  if (!template) {
    redirect('/templates');
  }

  // 3. Find an existing draft: ?id= > cookie > none.
  const cookieStore = await cookies();
  const cookieKey = `${COOKIE_PREFIX}${templateKey}`;
  let invitationId = forcedId ?? cookieStore.get(cookieKey)?.value ?? null;

  if (invitationId) {
    const owned = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: session.user.id },
      select: { id: true, canvas: true, slug: true },
    });
    if (!owned) invitationId = null; // stale — fall through to bootstrap
    else if (!owned.canvas) {
      const { ensureCanvasDocument } = await import('@/lib/invitations/ensure-canvas');
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await ensureCanvasDocument(tx, owned.id);
      });
    }
  }

  if (!invitationId) {
    // Bootstrap: client-side POST that sets the cookie + returns a draft id,
    // then router.replace back with ?id=<uuid> so the server can render.
    return <EditorBootstrap templateKey={templateKey} />;
  }

  // 4. Load the canvas document.
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, canvas: true, slug: true },
  });
  if (!inv) {
    redirect('/templates');
  }
  const document = parseCanvasOrEmpty(inv.canvas ?? null);
  const shareUrl = `/i/${inv.slug}`;

  const { locale } = await getI18n();

  return (
    <div className="h-[calc(100dvh-56px)] w-full">
      <CanvasEditorClient
        invitationId={inv.id}
        initialDocument={JSON.parse(JSON.stringify(document))}
        shareUrl={shareUrl}
        locale={locale}
        editorMode="guest"
      />
    </div>
  );
}
