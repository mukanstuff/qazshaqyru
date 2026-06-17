import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentSession } from '@/lib/api';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutButton } from '@/components/logout-button';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentSession();
  if (!ctx) redirect('/login?redirect=/admin');
  if (!ctx.user.isAdmin) redirect('/dashboard');

  const [pendingOrders, activeTemplates, totalUsers] = await Promise.all([
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.template.count({ where: { isActive: true } }),
    prisma.user.count(),
  ]);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-stone-900">⚙</span>
            <span className="font-serif text-lg text-stone-800">Admin</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-stone-500 hover:text-stone-900">Обзор</Link>
            <Link href="/admin/orders" className="text-stone-500 hover:text-stone-900">
              Заказы
              {pendingOrders > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px]">
                  {pendingOrders}
                </span>
              )}
            </Link>
            <Link href="/admin/templates" className="text-stone-500 hover:text-stone-900">
              Шаблоны <span className="text-xs text-stone-400">({activeTemplates})</span>
            </Link>
            <Link href="/admin/users" className="text-stone-500 hover:text-stone-900">
              Пользователи <span className="text-xs text-stone-400">({totalUsers})</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </main>
  );
}
