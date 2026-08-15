import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CanvasEditorPage({ params }: Props) {
  const { id } = await params;

  const session = await getCurrentSession();
  if (!session) redirect('/login?next=/invitations/' + encodeURIComponent(id) + '/canvas');

  // 2026-08-15: /canvas is a redirect-only route. The canonical editor URL
  // is /editor/[templateKey]?id=<draftUuid>; this preserves ?id= on the way.
  const stub = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { templateKey: true },
  });
  if (stub?.templateKey) {
    redirect(`/editor/${encodeURIComponent(stub.templateKey)}?id=${encodeURIComponent(id)}`);
  }

  // No templateKey → nothing we can do here; let the new editor bootstrap a draft.
  redirect('/templates');
}