'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface HubGuest {
  id: string;
  name: string;
  phone: string | null;
  side: 'bride' | 'groom' | null;
  householdLabel: string | null;
  hasPlusOne: boolean;
  plusOneName: string | null;
  sentAt: string | null;
  openedAt: string | null;
  responseStatus: string | null;
  dietaryRestrictions: string | null;
  message: string | null;
}

export type GuestStatusFilter =
  | 'all'
  | 'attending'
  | 'not_attending'
  | 'pending'
  | 'opened';

interface RawGuest {
  id: string;
  name: string;
  phone: string | null;
  side: string | null;
  householdLabel: string | null;
  hasPlusOne: boolean;
  plusOneName: string | null;
  sentAt: string | null;
  openedAt: string | null;
  response?: { status: string; dietaryRestrictions?: string | null; message?: string | null } | null;
}

function normalize(raw: RawGuest): HubGuest {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    side: raw.side === 'bride' || raw.side === 'groom' ? raw.side : null,
    householdLabel: raw.householdLabel,
    hasPlusOne: raw.hasPlusOne,
    plusOneName: raw.plusOneName,
    sentAt: raw.sentAt,
    openedAt: raw.openedAt,
    responseStatus: raw.response?.status ?? null,
    dietaryRestrictions: raw.response?.dietaryRestrictions ?? null,
    message: raw.response?.message ?? null,
  };
}

function isAttending(status: string | null): boolean {
  return status === 'attending' || status === 'attending_plus_one' || status === 'attending_no_children';
}

export interface AddGuestInput {
  name: string;
  phone?: string;
  side?: 'bride' | 'groom';
  hasPlusOne?: boolean;
  householdLabel?: string;
}

export interface UpdateGuestInput {
  id: string;
  name: string;
  phone?: string | null;
  hasPlusOne?: boolean;
  householdLabel?: string | null;
}

/**
 * Data layer for the hub's guests sheet. Talks to /api/guests directly —
 * the previous "teleport into the canvas editor via ?panel=guests" path had
 * no live listener for canvas-based invitations (dead deep-link), so this
 * hook exists instead of routing through that broken plumbing.
 */
export function useHubGuests(invitationId: string, initialGuests: HubGuest[]) {
  const [guests, setGuests] = useState<HubGuest[]>(initialGuests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/guests?invitationId=${encodeURIComponent(invitationId)}&limit=100`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('loadError');
      setGuests((data.guests as RawGuest[]).map(normalize));
    } catch {
      setError('loadError');
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  const addGuests = useCallback(
    async (input: AddGuestInput[]) => {
      setMutating('add');
      setError(null);
      try {
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationId, guests: input }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error('addError');
        await refresh();
        return { created: (data.created as number) ?? 0 };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'addError');
        return { created: 0 };
      } finally {
        setMutating(null);
      }
    },
    [invitationId, refresh]
  );

  const updateGuest = useCallback(
    async (input: UpdateGuestInput) => {
      setMutating(input.id);
      setError(null);
      try {
        const res = await fetch('/api/guests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestId: input.id, ...input }),
        });
        if (!res.ok) throw new Error('updateError');
        await refresh();
      } catch {
        setError('updateError');
      } finally {
        setMutating(null);
      }
    },
    [refresh]
  );

  const deleteGuest = useCallback(
    async (guestId: string) => {
      setMutating(guestId);
      setError(null);
      try {
        const res = await fetch(`/api/guests?guestId=${encodeURIComponent(guestId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('deleteError');
        setGuests((prev) => prev.filter((g) => g.id !== guestId));
      } catch {
        setError('deleteError');
      } finally {
        setMutating(null);
      }
    },
    []
  );

  const exportGuests = useCallback(
    async (slug: string, format: 'csv' | 'xlsx' = 'csv', locale: 'ru' | 'kz' = 'ru') => {
      setMutating('export');
      setError(null);
      try {
        const res = await fetch(`/api/invitations/${invitationId}/guests/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, locale }),
        });
        if (!res.ok) throw new Error('exportError');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests-${slug}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setError('exportError');
      } finally {
        setMutating(null);
      }
    },
    [invitationId]
  );

  useEffect(() => {
    setGuests(initialGuests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId]);

  const funnel = useMemo(() => {
    let attending = 0;
    let notAttending = 0;
    let pending = 0;
    let opened = 0;
    for (const g of guests) {
      if (isAttending(g.responseStatus)) attending += 1;
      else if (g.responseStatus === 'not_attending') notAttending += 1;
      else pending += 1;
      if (g.openedAt) opened += 1;
    }
    return { attending, notAttending, pending, opened, total: guests.length };
  }, [guests]);

  const filterGuests = useCallback(
    (filter: GuestStatusFilter, search: string) => {
      const q = search.trim().toLowerCase();
      return guests.filter((g) => {
        if (q && !g.name.toLowerCase().includes(q)) return false;
        if (filter === 'all') return true;
        if (filter === 'attending') return isAttending(g.responseStatus);
        if (filter === 'not_attending') return g.responseStatus === 'not_attending';
        if (filter === 'pending') return !g.responseStatus || g.responseStatus === 'pending';
        if (filter === 'opened') return Boolean(g.openedAt);
        return true;
      });
    },
    [guests]
  );

  return {
    guests,
    loading,
    error,
    mutating,
    funnel,
    refresh,
    addGuests,
    updateGuest,
    deleteGuest,
    exportGuests,
    filterGuests,
    clearError: () => setError(null),
  };
}

/**
 * A guest who still owes an answer.
 *
 * Lives here, beside the type it tests, because it was defined privately in
 * HubNextStep and then re-implemented for the section badge — two copies of
 * the same rule that decide what the owner is told to do next and how big the
 * job is. They agreed on the day they were written and nothing kept them that
 * way.
 */
export function isGuestPending(g: HubGuest): boolean {
  return !g.responseStatus || g.responseStatus === 'pending';
}
