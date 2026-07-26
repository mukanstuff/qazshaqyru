import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/shared/utils';

interface AdminTableShellProps {
  children: ReactNode;
  className?: string;
}

export function AdminTableShell({ children, className }: AdminTableShellProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">{children}</table>
      </div>
    </Card>
  );
}

export const adminTableHeadClass = 'border-b border-us-border bg-us-accent/5';
export const adminTableThClass = 'px-4 py-3 text-left text-sm font-medium text-us-ink-muted';
export const adminTableTdClass = 'border-b border-us-border/50 px-4 py-3 text-sm text-us-ink';
export const adminTableRowClass = 'transition-colors hover:bg-us-accent/[0.03]';
