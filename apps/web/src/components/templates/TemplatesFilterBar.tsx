'use client';

import { Search, X } from 'lucide-react';
import { TemplateFilterChip } from '@/components/templates/TemplateFilterChip';
import { categoryIcon } from '@/components/templates/category-icons';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

export interface FilterCategory {
  key: string;
  label: string;
  count?: number;
}

interface TemplatesFilterBarProps {
  categories: FilterCategory[];
  active: string;
  onSelect: (key: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
  className?: string;
}

export function TemplatesFilterBar({
  categories,
  active,
  onSelect,
  query,
  onQueryChange,
  searchLabel,
  className,
}: TemplatesFilterBarProps) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        'border-b border-us-border/40 bg-[#fcfcfb]',
        className,
      )}
    >
      <div className="us-container space-y-3 py-3">
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={searchLabel}
        >
          {categories.map((cat) => {
            const Icon = categoryIcon(cat.key);
            const label =
              cat.count && cat.count > 0 ? `${cat.label} · ${cat.count}` : cat.label;
            return (
              <TemplateFilterChip
                key={cat.key}
                label={label}
                icon={Icon}
                active={active === cat.key}
                onClick={() => onSelect(cat.key)}
              />
            );
          })}
        </div>

        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-us-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="w-full rounded-full border border-us-border bg-white py-2 pl-9 pr-9 font-body text-sm text-us-ink placeholder:text-us-ink-muted focus:border-us-accent focus:outline-none focus:ring-2 focus:ring-us-accent/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label={t('templatesPage.previewClose')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-us-ink-muted transition-colors hover:bg-us-ivory hover:text-us-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}