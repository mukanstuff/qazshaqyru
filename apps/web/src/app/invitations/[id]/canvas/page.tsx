import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ panel?: string }>;
}

export default async function CanvasEditorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { panel } = await searchParams;

  const session = await getCurrentSession();
  if (!session) redirect(`/login?redirect=${encodeURIComponent(`/invitations/${id}/canvas`)}`);

  // 2026-08-15: /canvas is a redirect-only route. The canonical editor URL
  // is /editor/[templateKey]?id=<draftUuid>; this preserves ?id= on the way.
  // 2026-08-18 (Phase 2, hub screen): also forward ?panel=<id> so callers
  // (the hub "Гости" tile) can deep-link into the matching editor panel.
  const stub = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { templateKey: true },
  });
  if (stub?.templateKey) {
    const params = new URLSearchParams({ id });
    if (panel) params.set('panel', panel);
    redirect(`/editor/${encodeURIComponent(stub.templateKey)}?${params.toString()}`);
  }

  // No templateKey → nothing we can do here; let the new editor bootstrap a draft.
  redirect('/templates');
}