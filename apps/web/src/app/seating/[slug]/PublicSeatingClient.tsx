'use client';

import { useMemo } from 'react';
import { PublicSeatingView } from '@/components/seating/PublicSeatingView';

interface InvitationMeta {
  id: string;
  slug: string;
  title: string;
  eventDate: Date | string;
  eventTime: string | null;
  eventTimezone: string | null;
  isPast: boolean;
}

interface TableData {
  id: string;
  name: string;
  capacity: number;
  assignedCount: number;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  rotation: number | null;
  shape: string | null;
  tableColor: string | null;
  guests: { id: string; name: string }[];
}

interface Props {
  data: {
    invitation: InvitationMeta;
    highlightGuestId: string | null;
    tables: TableData[];
  };
  guestToken: string | null;
}

export default function PublicSeatingClient({ data }: Props) {
  const { invitation, tables, highlightGuestId } = data;
  const dateLocale = 'ru';

  const eventLine = useMemo(() => {
    if (!invitation.eventDate) return '';
    const d = new Date(invitation.eventDate);
    const formatted = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: invitation.eventTimezone ?? 'Asia/Almaty',
    }).format(d);
    return invitation.eventTime ? `${formatted} · ${invitation.eventTime}` : formatted;
  }, [invitation.eventDate, invitation.eventTime, invitation.eventTimezone]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(`/seating/${invitation.slug}`, window.location.origin);
    return url.toString();
  }, [invitation.slug]);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-us-ink/8 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-us-accent">
            Рассадка
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-us-ink">
            {invitation.title}
          </h1>
          {eventLine && (
            <p className="mt-1 text-sm text-us-ink-muted">{eventLine}</p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <PublicSeatingView
          invitationId={invitation.id}
          tables={tables}
          highlightGuestId={highlightGuestId ?? undefined}
        />

        {shareUrl && (
          <div className="mt-6 rounded-2xl border border-us-ink/8 bg-us-ink/2 p-4 text-center">
            <p className="text-sm text-us-ink-muted">
              Сохраните эту ссылку — она покажет ваш стол в день торжества
            </p>
            <p className="mt-2 break-all font-mono text-xs text-us-ink">{shareUrl}</p>
          </div>
        )}
      </div>
    </main>
  );
}
