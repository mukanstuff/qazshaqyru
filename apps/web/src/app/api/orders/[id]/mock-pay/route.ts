import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { checkSameOrigin } from '@/lib/shared/api';
import { requireSessionForPaymentRedirect } from '@/lib/payments/payment-route-auth';
import { completeOrderPayment } from '@/lib/payments/order-completion';
import { isMockPaymentAllowed } from '@/lib/payments/mock-payment-guard';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

/**
 * Mock-pay: marks pending mock order as paid and redirects to the editor.
 * Disabled in production. Only works when paymentProvider === 'mock'.
 */
export async function POST(request: NextRequest, { params }: Props) {
  const { id } = params;

  if (!isMockPaymentAllowed()) {
    redirect('/dashboard?payment=invalid');
  }

  if (!checkSameOrigin(request)) {
    redirect('/dashboard?payment=invalid');
  }

  const { user } = await requireSessionForPaymentRedirect(`/invitations?payment=resume&order=${id}`);

  const formData = await request.formData().catch(() => null);
  const token = formData?.get('token')?.toString() ?? '';

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) {
    redirect('/dashboard?payment=invalid');
  }

  if (order.paymentProvider !== 'mock') {
    redirect('/dashboard?payment=invalid');
  }

  if (!order.paymentId || !token || order.paymentId !== token) {
    redirect('/dashboard?payment=invalid');
  }

  if (order.status === 'paid' && order.invitationId) {
    redirect(`/invitations/${order.invitationId}?published=1`);
  }

  if (order.status !== 'pending') {
    redirect('/dashboard?payment=invalid');
  }

  const result = await completeOrderPayment(order.id, { paidAmountKzt: order.amountKzt });

  if (!result.ok) {
    redirect('/dashboard?payment=invalid');
  }

  const invitationId = result.invitationId;
  if (!invitationId) {
    redirect('/dashboard?payment=invalid');
  }

  redirect(`/invitations/${invitationId}?published=1`);
}
