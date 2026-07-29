'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/shared/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';

interface AdminNavProps {
  pendingOrders: number;
  activeTemplates: number;
  totalUsers: number;
}

const NAV = [
  { href: '/admin', label: 'Обзор', exact: true },
  { href: '/admin/orders', label: 'Заказы', badgeKey: 'orders' as const },
  { href: '/admin/templates', label: 'Шаблоны', countKey: 'templates' as const },
];

export function AdminHeader({ pendingOrders, activeTemplates, totalUsers }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <>
      <AppHeader variant="admin" />
      <div className="border-b border-us-border bg-us-surface">
        <div className="us-container flex flex-wrap items-center gap-2 px-0 py-2">
          {NAV.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                className={cn(
                  isActive && 'border-b-2 border-us-cta rounded-b-none'
                )}
              >
                <Link href={item.href} className="inline-flex items-center gap-1.5">
                  {item.label}
                  {item.badgeKey === 'orders' && pendingOrders > 0 && (
                    <Badge variant="default" className="ml-1 px-1.5 py-0 text-[10px]">
                      {pendingOrders}
                    </Badge>
                  )}
                  {item.countKey === 'templates' && (
                    <span className="text-us-ink-muted">({activeTemplates})</span>
                  )}
                </Link>
              </Button>
            );
          })}
          <span className="ml-auto hidden text-sm text-us-ink-muted sm:inline">
            Пользователей: {totalUsers}
          </span>
        </div>
      </div>
    </>
  );
}
