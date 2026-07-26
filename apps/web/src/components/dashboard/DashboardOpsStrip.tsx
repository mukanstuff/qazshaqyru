'use client';



import Link from 'next/link';

import { Download, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { useI18n } from '@/i18n';



/**

 * Dashboard ops strip — surfaces Standard value after first publish.

 */

export function DashboardOpsStrip({ hasPublished }: { hasPublished: boolean }) {

  const { t } = useI18n();



  if (!hasPublished) {

    return null;

  }



  return (

    <Card className="us-glass-soft border-us-border/70 shadow-us-sm" data-testid="dashboard-ops-strip">

      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="space-y-1 text-sm">

          <div className="font-semibold text-us-ink">{t('dashboard.opsStrip.title')}</div>

          <p className="text-us-ink-muted">{t('dashboard.opsStrip.body')}</p>

        </div>

        <div className="flex flex-wrap gap-2">

          <Button variant="outline" size="sm" className="min-h-11" asChild>

            <Link href="/pricing">

              <Users className="h-3.5 w-3.5" />

              {t('dashboard.opsStrip.pricing')}

            </Link>

          </Button>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-us-border px-2.5 py-1.5 text-xs text-us-ink-muted">

            <Download className="h-3.5 w-3.5" />

            {t('dashboard.opsStrip.hintPublished')}

          </span>

        </div>

      </CardContent>

    </Card>

  );

}

