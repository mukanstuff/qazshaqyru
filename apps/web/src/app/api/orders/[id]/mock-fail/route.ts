import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: Props) {
  const { id } = params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (order && order.status === 'pending') {
    await prisma.order.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
  }

  redirect('/templates?payment=failed');
}
