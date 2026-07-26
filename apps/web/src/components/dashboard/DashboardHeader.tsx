'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface DashboardHeaderProps {
  showCreate?: boolean;
}

export function DashboardHeader({ showCreate = true }: DashboardHeaderProps) {
  const { t } = useI18n();
  const createLabel = t('dashboard.create');

  return (
    <AppHeader
      action={
        showCreate ? (
        <Button variant="default" size="sm" className="max-w-[9.5rem] px-2.5 sm:max-w-none sm:px-3" asChild>
          <Link href="/templates" aria-label={createLabel} title={createLabel}>
            <Plus className="shrink-0" />
            <span className="hidden truncate sm:inline">{createLabel}</span>
            <span className="truncate text-xs sm:hidden">{t('dashboard.createShort')}</span>
          </Link>
        </Button>
        ) : undefined
      }
    />
  );
}
