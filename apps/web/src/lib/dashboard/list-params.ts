/**
 * Sort and filter values for the dashboard invitation list.
 *
 * Deliberately its own module rather than living next to the control that
 * renders them: that control is a Client Component, and anything exported from
 * a `'use client'` module reaches the server as a client reference, not as the
 * value itself — a server-side `DASHBOARD_SORTS.includes(...)` throws
 * "Attempted to call includes() from the server". The page needs these to parse
 * its search params, so they belong in a module both sides can own.
 */
export const DASHBOARD_SORTS = ['new', 'event', 'guests', 'name'] as const;
export type DashboardSort = (typeof DASHBOARD_SORTS)[number];

export const DASHBOARD_FILTERS = ['all', 'published', 'draft'] as const;
export type DashboardFilter = (typeof DASHBOARD_FILTERS)[number];

export function parseDashboardSort(value: string | undefined): DashboardSort {
  return (DASHBOARD_SORTS as readonly string[]).includes(value ?? '')
    ? (value as DashboardSort)
    : 'new';
}

export function parseDashboardFilter(value: string | undefined): DashboardFilter {
  return (DASHBOARD_FILTERS as readonly string[]).includes(value ?? '')
    ? (value as DashboardFilter)
    : 'all';
}
