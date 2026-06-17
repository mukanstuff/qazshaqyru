import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: { session_id?: string };
}

/**
 * Stripe (and Kaspi) return the user to this URL after payment. We do a
 * final check that the order belongs to the current user, then hand them
 * off to the editor.
 *
 * Important: this endpoint must NOT be the source of truth for "did the
 * payment succeed". Always trust the webhook, not the redirect.
 */
export async function GET(_request: NextRequest, { params }: Props) {
  const { id } = params;

  // requireAuth redirects to /login if there's no session, so it cannot
  // be reached anonymously.
  const ctx = await requireAuth();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { invitation: true },
  });

  if (!order || order.userId !== ctx.user.id) {
    redirect('/dashboard?payment=not_found');
  }

  if (order.status === 'paid' && order.invitation) {
    redirect(`/invitations/${order.invitation.id}?paid=1`);
  }

  redirect('/templates?payment=pending');
}
