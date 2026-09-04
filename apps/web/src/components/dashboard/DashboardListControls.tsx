'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';
import {
  DASHBOARD_FILTERS,
  type DashboardFilter,
  type DashboardSort,
} from '@/lib/dashboard/list-params';

/**
 * Search, status filter and sort for the invitation list.
 *
 * The competitor's dashboard has all three; ours had a fixed newest-first list
 * with no way to find anything, which is survivable with one wedding and
 * useless for the agency plan we sell — an event planner with thirty
 * invitations was expected to scroll.
 *
 * State lives in the URL rather than in component state: the page is a server
 * component that already re-renders on every request, so filtering there keeps
 * one source of truth, and the resulting view is shareable and survives a
 * reload. The input is debounced so typing does not fire a request per
 * keystroke.
 */
interface Props {
  q: string;
  sort: DashboardSort;
  filter: DashboardFilter;
  shown: number;
  total: number;
}

export function DashboardListControls({ q, sort, filter, shown, total }: Props) {
  const { t } = useI18n();
  const k = (key: string) => t(`dashboard.list.${key}`);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState(q);

  // The URL is the source of truth, so a browser Back or a reset button has to
  // pull the input back with it.
  const applied = useRef(q);
  useEffect(() => {
    if (q !== applied.current) {
      applied.current = q;
      setDraft(q);
    }
  }, [q]);

  const push = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params?.toString() ?? '');
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '' || value === 'all' || (key === 'sort' && value === 'new')) {
        sp.delete(key);
      } else {
        sp.set(key, value);
      }
    }
    const query = sp.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  useEffect(() => {
    if (draft === applied.current) return;
    const id = setTimeout(() => {
      applied.current = draft;
      push({ q: draft.trim() || null });
    }, 250);
    return () => clearTimeout(id);
    // `push` closes over params/pathname, both stable for a given URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const isFiltered = q.trim() !== '' || filter !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-us-ink-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={k('searchLabel')}
            placeholder={k('searchPlaceholder')}
            // WebKit draws its own clear button inside type="search"; ours is
            // the one that also resets the URL, so the native one is hidden
            // rather than left sitting next to it as a second ✕.
            className="min-h-11 w-full rounded-xl border border-us-border bg-white pl-9 pr-9 font-body text-sm text-us-ink outline-none transition focus:border-us-accent/60 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {draft ? (
            <button
              type="button"
              onClick={() => setDraft('')}
              aria-label={k('reset')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-us-ink-muted transition hover:bg-us-ivory hover:text-us-ink"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <label className="sr-only" htmlFor="dashboard-sort">
          {k('sortLabel')}
        </label>
        <select
          id="dashboard-sort"
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
          className="min-h-11 rounded-xl border border-us-border bg-white px-3 font-body text-sm text-us-ink outline-none transition focus:border-us-accent/60"
        >
          <option value="new">{k('sortNewest')}</option>
          <option value="event">{k('sortEventDate')}</option>
          <option value="guests">{k('sortGuests')}</option>
          <option value="name">{k('sortName')}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DASHBOARD_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => push({ filter: value })}
            aria-pressed={filter === value}
            className={cn(
              'min-h-9 rounded-full border px-3 font-body text-sm transition',
              filter === value
                ? 'border-us-accent bg-us-accent/10 text-us-ink'
                : 'border-us-border bg-white text-us-ink-muted hover:text-us-ink'
            )}
          >
            {value === 'all' ? k('filterAll') : value === 'published' ? k('filterPublished') : k('filterDraft')}
          </button>
        ))}
        {isFiltered ? (
          <span className="font-body text-xs text-us-ink-muted">
            {t('dashboard.list.shown', { shown, total })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
