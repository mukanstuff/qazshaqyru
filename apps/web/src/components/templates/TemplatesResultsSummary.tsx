'use client';

import { ArrowDownAZ, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

interface TemplatesResultsSummaryProps {
  count: number;
  categoryLabel?: string;
  hasActiveFilter: boolean;
  onReset: () => void;
  className?: string;
}

export function TemplatesResultsSummary({
  count,
  categoryLabel,
  hasActiveFilter,
  onReset,
  className,
}: TemplatesResultsSummaryProps) {
  const { t } = useI18n();
  const foundText = t('templatesPage.resultsFound').replace('{count}', String(count));
  const inCategoryText = categoryLabel
    ? t('templatesPage.resultsInCategory').replace('{category}', categoryLabel)
    : null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border border-us-border/60 bg-white px-4 py-3 shadow-us-sm',
        className,
      )}
      data-testid="templates-results-summary"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-us-accent/10 text-us-accent">
          <ArrowDownAZ className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-body text-sm text-us-ink">
          <span className="font-display text-base font-medium text-us-ink">{foundText}</span>
          {inCategoryText ? (
            <span className="ml-1.5 text-us-ink-muted">{inCategoryText}</span>
          ) : null}
        </p>
      </div>

      {hasActiveFilter ? (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-us-border bg-us-ivory px-3 py-1.5 font-body text-xs font-medium text-us-ink transition-colors hover:border-us-accent/40 hover:text-us-accent"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {t('templatesPage.resultsReset')}
        </button>
      ) : (
        <span className="ml-auto font-body text-xs text-us-ink-muted">
          {t('templatesPage.filters.all')}
        </span>
      )}
    </div>
  );
}