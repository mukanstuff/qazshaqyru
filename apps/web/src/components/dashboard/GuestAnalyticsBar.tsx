import { computeGuestAnalytics } from '@/lib/guests/guest-analytics';
import { cn } from '@/lib/shared/utils';

interface Props {
  guestRows: Array<{ response?: { status: string } | null }>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function GuestAnalyticsBar({ guestRows, t }: Props) {
  if (guestRows.length === 0) return null;

  const stats = computeGuestAnalytics(guestRows);
  const attendingWidth = stats.total > 0 ? (stats.attending / stats.total) * 100 : 0;
  const declinedWidth = stats.total > 0 ? (stats.notAttending / stats.total) * 100 : 0;
  const pendingWidth = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;

  return (
    <div className="mt-2 space-y-1.5">
      <div
        className="flex h-2 overflow-hidden rounded-full bg-us-border"
        role="progressbar"
        aria-valuenow={stats.attendingPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('dashboard.analytics.attendingPercent', { percent: stats.attendingPercent })}
      >
        {attendingWidth > 0 && (
          <div className="bg-us-success transition-all" style={{ width: `${attendingWidth}%` }} />
        )}
        {declinedWidth > 0 && (
          <div className="bg-us-danger transition-all" style={{ width: `${declinedWidth}%` }} />
        )}
        {pendingWidth > 0 && (
          <div className="bg-us-cta/30 transition-all" style={{ width: `${pendingWidth}%` }} />
        )}
      </div>
      <p className="text-xs text-us-ink-muted">
        {t('dashboard.analytics.summary', {
          attending: stats.attending,
          total: stats.total,
          percent: stats.attendingPercent,
          responded: stats.responded,
        })}
        {stats.notAttending > 0 && (
          <span className="text-us-danger">
            {' '}
            · {t('dashboard.analytics.declined', { count: stats.notAttending })}
          </span>
        )}
        {stats.pending > 0 && (
          <span className="text-us-ink-muted">
            {' '}
            · {t('dashboard.analytics.pending', { count: stats.pending })}
          </span>
        )}
      </p>
    </div>
  );
}
