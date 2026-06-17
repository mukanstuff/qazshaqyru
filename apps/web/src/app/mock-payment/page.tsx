import { redirect } from 'next/navigation';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { orderId?: string; token?: string };
}

export default async function MockPaymentPage({ searchParams }: Props) {
  const { orderId, token } = searchParams;

  if (!orderId || !token) {
    redirect('/dashboard?payment=invalid');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { template: { select: { nameRu: true } } },
  });

  if (!order) redirect('/dashboard?payment=not_found');

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="font-serif text-2xl text-stone-800 mb-2">Тестовая оплата</h1>
          <p className="text-sm text-stone-500">
            Это режим разработки. Реальная оплата через Kaspi/Stripe в продакшене.
          </p>
        </div>

        <div className="bg-stone-50 rounded-2xl p-5 mb-6">
          <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">К оплате</p>
          <p className="text-3xl font-serif text-stone-800">
            {order.amountKzt.toLocaleString('ru-RU')} ₸
          </p>
          <p className="text-sm text-stone-600 mt-2">{order.template.nameRu}</p>
        </div>

        <div className="space-y-3">
          <form action={`/api/orders/${order.id}/mock-pay`} method="POST">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full h-12 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #a78b4a 100%)' }}
            >
              ✓ Подтвердить оплату
            </button>
          </form>
          <form action={`/api/orders/${order.id}/mock-fail`} method="POST">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200"
            >
              Отменить
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
