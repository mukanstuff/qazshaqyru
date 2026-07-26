import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { checkSameOrigin } from '@/lib/shared/api';
import { requireSessionForPaymentRedirect } from '@/lib/payments/payment-route-auth';
import { isMockPaymentAllowed } from '@/lib/payments/mock-payment-guard';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

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

  if (order.status === 'pending') {
    await prisma.order.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
  }

  const failTarget = order.invitationId
    ? `/invitations/${order.invitationId}?payment=failed`
    : '/templates?payment=failed';

  redirect(failTarget);
}
