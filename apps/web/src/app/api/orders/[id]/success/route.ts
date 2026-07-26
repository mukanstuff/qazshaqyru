import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { requireSessionForPaymentRedirect } from '@/lib/payments/payment-route-auth';
import { syncOrderPaymentStatus } from '@/lib/payments/payment-sync';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

/**
 * After payment the provider redirects the user here.
 *
 * Flow:
 * 1. Verify the user owns this order (requireAuth).
 * 2. If already paid → go to editor.
 * 3. If pending → check via webhook or show "payment pending" page.
 * 4. If cancelled → go back to templates.
 *
 * Security: requireAuth ensures only the order owner can see this page.
 * We trust the webhook as source of truth for payment status.
 */
export async function GET(_request: NextRequest, { params }: Props) {
  const { id } = params;

  const { user } = await requireSessionForPaymentRedirect(`/api/orders/${id}/success`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { invitation: { select: { id: true, slug: true } } },
  });

  if (!order || order.userId !== user.id) {
    redirect('/dashboard?payment=not_found');
  }

  // Already paid
  if (order.status === 'paid' && order.invitation) {
    redirect(`/invitations/${order.invitation.id}?published=1`);
  }

  // Payment cancelled
  if (order.status === 'cancelled') {
    redirect('/templates?payment=cancelled');
  }

  // Payment pending — try sync with provider before showing wait state.
  if (order.status === 'pending') {
    const sync = await syncOrderPaymentStatus(id, user.id);
    if (sync.status === 'paid' && sync.invitationId) {
      redirect(`/invitations/${sync.invitationId}?published=1`);
    }
    if (order.invitation) {
      redirect(`/invitations/${order.invitation.id}?payment=pending`);
    }
    redirect('/dashboard?payment=pending');
  }

  // Fallback
  redirect('/dashboard');
}
