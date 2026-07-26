import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';

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
    <EditorWorkspaceShell
      banner={
        <AdminHeader
          pendingOrders={pendingOrders}
          activeTemplates={activeTemplates}
          totalUsers={totalUsers}
        />
      }
    >
      <div className="us-container py-8">{children}</div>
    </EditorWorkspaceShell>
  );
}
