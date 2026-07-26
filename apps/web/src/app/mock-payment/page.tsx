import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { isMockPaymentAllowed } from '@/lib/payments/mock-payment-guard';
import { LogoMark } from '@/components/shared/ornaments';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { orderId?: string; token?: string };
}

export default async function MockPaymentPage({ searchParams }: Props) {
  if (!isMockPaymentAllowed()) {
    redirect('/dashboard?payment=invalid');
  }

  const { orderId, token } = searchParams;

  if (!orderId || !token) {
    redirect('/dashboard?payment=invalid');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { template: { select: { nameRu: true } } },
  });

  if (!order) redirect('/dashboard?payment=not_found');

  const session = await getCurrentSession();
  if (!session || order.userId !== session.user.id) {
    redirect('/dashboard?payment=invalid');
  }

  if (!order.paymentId || order.paymentId !== token) {
    redirect('/dashboard?payment=invalid');
  }

  if (order.status !== 'pending') {
    redirect('/dashboard?payment=invalid');
  }

  return (
    <PublicShell>
      <div className="us-container flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-us-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-us-accent/8">
              <LogoMark size={32} />
            </div>
            <CardTitle className="font-display text-2xl">Тестовая оплата</CardTitle>
            <CardDescription>
              Режим разработки. После оплаты приглашение будет опубликовано автоматически.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border border-us-border bg-us-ivory/80 p-6 text-center">
              <p className="us-overline">К оплате</p>
              <p className="mt-2 font-display text-3xl font-semibold text-us-accent">
                {order.amountKzt.toLocaleString('ru-RU')} ₸
              </p>
              <p className="mt-2 font-body text-sm text-us-ink-muted">{order.template.nameRu}</p>
            </div>

            <div className="space-y-3">
              <form action={`/api/orders/${order.id}/mock-pay`} method="POST">
                <input type="hidden" name="token" value={token} />
                <Button type="submit" className="w-full" variant="default">
                  ✓ Подтвердить оплату
                </Button>
              </form>
              <form action={`/api/orders/${order.id}/mock-fail`} method="POST">
                <input type="hidden" name="token" value={token} />
                <Button type="submit" className="w-full" variant="outline">
                  Отменить
                </Button>
              </form>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/dashboard">← В кабинет</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
