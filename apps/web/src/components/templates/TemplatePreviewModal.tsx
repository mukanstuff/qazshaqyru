'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { quickWizardHref } from '@/lib/shared/quick-wizard-url';
import type { Template } from '@prisma/client';

interface TemplatePreviewModalProps {
  template: Template;
  displayName: string;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, displayName, onClose }: TemplatePreviewModalProps) {
  const { t } = useI18n();
  const previewSrc = `/i/demo?layout=${encodeURIComponent(template.slug)}&embed=1`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-us-ink/55 backdrop-blur-md">
      <div className="us-glass-strong flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-medium text-us-ink">{displayName}</p>
          <p className="font-body text-sm text-us-ink-muted">{t('templatesPage.previewFullscreen')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="default" size="default" asChild className="hidden min-h-11 sm:inline-flex">
            <Link href={quickWizardHref(template.slug)}>{t('templatesPage.quickStart')}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={onClose}
            aria-label={t('templatesPage.previewClose')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-6">
        <iframe
          src={previewSrc}
          title={displayName}
          className="h-full w-full rounded-xl border border-us-border bg-us-surface shadow-us-lg"
        />
      </div>

      <div className="us-glass-strong flex items-center justify-center gap-3 border-t px-4 py-3 sm:hidden">
        <Button variant="default" className="min-h-11 flex-1" asChild>
          <Link href={quickWizardHref(template.slug)}>{t('templatesPage.quickStart')}</Link>
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
          {t('templatesPage.previewClose')}
        </Button>
      </div>
    </div>
  );
}
