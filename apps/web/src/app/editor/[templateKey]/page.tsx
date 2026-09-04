/**
 * /editor/[templateKey]
 *
 * Canonical canvas editor entry:
 *   /templates → preview → "Редактировать" → /editor/[templateKey] (this page,
 *     no ?id=) → <EditorBootstrap /> POSTs /api/editor/from-template, which
 *     always creates a brand-new draft, and router.replace's back with
 *     ?id=<uuid> so the server can render on the second pass.
 *   /dashboard, /invitations/[id] → "Продолжить редактирование" already link
 *     straight here with an explicit ?id=<draftUuid> for the exact invitation.
 *
 * This page used to also resume a draft from a 30-day `editor:inv:{templateKey}`
 * cookie when no ?id= was given, so that catalog → same template twice in a
 * row picked up wherever you left off. That's the wrong place for that
 * feature: "continue editing" already exists and works via the dashboard's
 * explicit ?id= links above, so the catalog entry point re-opening a stale
 * draft from days ago (on the same account, or worse — a leftover cookie
 * from a *different* account on a shared browser) just looked like a bug
 * with no way to tell it apart from "start fresh". Catalog → editor without
 * an id now always means a new draft, full stop.
 */
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { CanvasEditorClient } from '@/app/invitations/[id]/canvas/CanvasEditorClient';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { getI18n } from '@/i18n/server';
import { EditorBootstrap } from '@/components/editor/EditorBootstrap';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ templateKey: string }>;
  searchParams: Promise<{ id?: string; panel?: string }>;
}

export default async function TemplateEditorPage({ params, searchParams }: Props) {
  const { templateKey } = await params;
  const { id: forcedId } = await searchParams;

  // 1. Auth gate.
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(`/editor/${templateKey}`)}`);
  }

  // 2. ?id= is the only way to land on an existing draft — it's how the
  // dashboard/hub link here. No ?id= means bootstrap a fresh one.
  //
  // Template resolution deliberately happens AFTER this, and only on the
  // bootstrap path. It used to gate the whole page: resolveTemplateBySlug
  // filters on `isActive`, so hiding a template from the catalog also bounced
  // every existing draft built from it straight back to /templates — the
  // owner's own work became unopenable because of an unrelated admin toggle.
  // Once `?id=` names an invitation you own, its stored canvas is the source
  // of truth and the URL segment is just a label.
  let invitationId = forcedId ?? null;

  if (invitationId) {
    const owned = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: session.user.id },
      select: { id: true, canvas: true, slug: true },
    });
    if (!owned) invitationId = null; // not ours (or gone) — fall through to bootstrap
    else if (!owned.canvas) {
      const { ensureCanvasDocument } = await import('@/lib/invitations/ensure-canvas');
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await ensureCanvasDocument(tx, owned.id);
      });
    }
  }

  if (!invitationId) {
    // Bootstrap: needs a real, live template to seed the draft from.
    const template = await resolveTemplateBySlug(templateKey);
    if (!template) {
      redirect('/templates');
    }
    // Client-side POST that creates a new draft, then router.replace back
    // with ?id=<uuid> so the server can render.
    return <EditorBootstrap templateKey={templateKey} />;
  }

  // 4. Load the canvas document.
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, canvas: true, slug: true, updatedAt: true, eventType: true },
  });
  if (!inv) {
    redirect('/templates');
  }
  const document = parseCanvasOrEmpty(inv.canvas ?? null);
  const shareUrl = `/i/${inv.slug}`;

  const { locale } = await getI18n();
  const pricing = await getInvitationPricing(inv.id, session.user.id);
  const fullAccess = !!(pricing?.fullAccess ?? pricing?.hasPaidOrder ?? false);

  return (
    <div className="h-[100dvh] w-full">
      <CanvasEditorClient
        invitationId={inv.id}
        initialDocument={JSON.parse(JSON.stringify(document))}
        initialUpdatedAt={inv.updatedAt.toISOString()}
        shareUrl={shareUrl}
        locale={locale}
        editorMode="admin"
        invitationSlug={inv.slug}
        eventType={inv.eventType}
        fullAccess={fullAccess}
        priceKzt={pricing?.priceKzt ?? 3990}
      />
    </div>
  );
}
