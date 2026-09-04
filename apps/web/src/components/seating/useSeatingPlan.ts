'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SeatingTableDto } from '@/lib/guests/seating';
import { expectedSeatsForRsvpStatus } from '@/lib/guests/headcount';
import { isHallObject, type TableShape } from '@/lib/guests/seating-layout';

export interface PlannerGuest {
  id: string;
  name: string;
  hasPlusOne: boolean;
  responseStatus: string | null;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Chairs this guest needs — same rule the server enforces. */
export function seatsForGuest(guest: PlannerGuest): number {
  return expectedSeatsForRsvpStatus(guest.responseStatus ?? 'pending', guest.hasPlusOne);
}

interface Options {
  invitationId: string;
  initialTables: SeatingTableDto[];
  guests: PlannerGuest[];
}

/**
 * Data layer for the seating planner.
 *
 * Positions are kept optimistically in local state while dragging and flushed
 * as one batched request shortly after the gesture ends — the plan editor's
 * most frequent write must not be one HTTP round-trip per pixel, nor one per
 * table when several move.
 */
export function useSeatingPlan({ invitationId, initialTables, guests }: Options) {
  const [tables, setTables] = useState<SeatingTableDto[]>(initialTables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [busy, setBusy] = useState(false);

  const pendingMoves = useRef<Map<string, { x: number; y: number }>>(new Map());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endpoint = `/api/invitations/${invitationId}/seating`;

  const markSaved = useCallback(() => {
    setSaveState('saved');
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveState('idle'), 1800);
  }, []);

  const request = useCallback(
    async (method: 'POST' | 'PATCH' | 'DELETE', body: unknown) => {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error((data as { message?: string }).message || 'save_failed');
        (err as Error & { code?: string }).code = (data as { error?: string }).error;
        throw err;
      }
      return data as Record<string, unknown>;
    },
    [endpoint]
  );

  const refresh = useCallback(async () => {
    const res = await fetch(endpoint);
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    if (Array.isArray((data as { tables?: unknown }).tables)) {
      setTables((data as { tables: SeatingTableDto[] }).tables);
    }
  }, [endpoint]);

  // ── Position flushing ──────────────────────────────────────────────────
  const flushMoves = useCallback(async () => {
    if (pendingMoves.current.size === 0) return;
    const moves = [...pendingMoves.current.entries()].map(([tableId, p]) => ({
      tableId,
      x: p.x,
      y: p.y,
    }));
    pendingMoves.current.clear();
    setSaveState('saving');
    try {
      const data = await request('POST', { moves });
      if (Array.isArray((data as { tables?: unknown }).tables)) {
        // Server clamps into the hall, so adopt its answer rather than trusting
        // the drag position we optimistically painted.
        setTables((data as { tables: SeatingTableDto[] }).tables);
      }
      markSaved();
    } catch {
      setSaveState('error');
      void refresh();
    }
  }, [markSaved, refresh, request]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => void flushMoves(), 450);
  }, [flushMoves]);

  /** Called continuously during a drag — local only, never hits the network. */
  const moveTableLocal = useCallback((tableId: string, x: number, y: number) => {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, x, y } : t)));
  }, []);

  /** Called once when a drag ends. */
  const commitTableMove = useCallback(
    (tableId: string, x: number, y: number) => {
      pendingMoves.current.set(tableId, { x, y });
      scheduleFlush();
    },
    [scheduleFlush]
  );

  // Don't leave an edit stranded in a timer if the user navigates away.
  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      if (pendingMoves.current.size > 0) {
        const moves = [...pendingMoves.current.entries()].map(([tableId, p]) => ({
          tableId,
          x: p.x,
          y: p.y,
        }));
        // keepalive lets this outlive the unload.
        void fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moves }),
          keepalive: true,
        }).catch(() => undefined);
      }
    };
  }, [endpoint]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const addTable = useCallback(
    // `capacity` is omitted for hall fixtures — they seat nobody, and the API
    // validates capacity as a real table capacity (min 1). The server derives
    // zero from the shape.
    async (input: {
      name: string;
      shape: TableShape;
      capacity?: number;
      w: number;
      h: number;
      x: number;
      y: number;
    }) => {
      setBusy(true);
      setSaveState('saving');
      try {
        const data = await request('POST', { ...input, tableColor: undefined });
        const table = (data as { table?: SeatingTableDto }).table;
        if (table) {
          setTables((prev) => [...prev, table]);
          setSelectedTableId(table.id);
        }
        markSaved();
      } catch {
        setSaveState('error');
      } finally {
        setBusy(false);
      }
    },
    [markSaved, request]
  );

  const updateTable = useCallback(
    async (tableId: string, patch: Partial<Pick<SeatingTableDto, 'name' | 'capacity' | 'shape' | 'tableColor' | 'rotation' | 'w' | 'h'>>) => {
      const before = tables;
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...patch } : t)));
      setSaveState('saving');
      try {
        const data = await request('PATCH', { tableId, ...patch });
        const table = (data as { table?: SeatingTableDto }).table;
        if (table) setTables((prev) => prev.map((t) => (t.id === tableId ? table : t)));
        markSaved();
        return true;
      } catch (e) {
        setTables(before);
        setSaveState('error');
        return e instanceof Error ? e.message : false;
      }
    },
    [markSaved, request, tables]
  );

  const deleteTable = useCallback(
    async (tableId: string) => {
      setBusy(true);
      setSaveState('saving');
      try {
        await request('DELETE', { tableId });
        setTables((prev) => prev.filter((t) => t.id !== tableId));
        setSelectedTableId((cur) => (cur === tableId ? null : cur));
        markSaved();
      } catch {
        setSaveState('error');
      } finally {
        setBusy(false);
      }
    },
    [markSaved, request]
  );

  const assignGuest = useCallback(
    async (guestId: string, tableId: string | null) => {
      setBusy(true);
      setSaveState('saving');
      try {
        await request('POST', { guestId, tableId });
        // Re-read rather than patching locally: seat maths and capacity live on
        // the server, and this keeps counts honest after a rejected edit.
        await refresh();
        markSaved();
        return null;
      } catch (e) {
        setSaveState('error');
        return e instanceof Error ? e.message : 'save_failed';
      } finally {
        setBusy(false);
      }
    },
    [markSaved, refresh, request]
  );

  // ── Derived ────────────────────────────────────────────────────────────
  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const seatedGuestIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of tables) for (const id of t.guestIds) set.add(id);
    return set;
  }, [tables]);

  const unassignedGuests = useMemo(
    () => guests.filter((g) => !seatedGuestIds.has(g.id) && g.responseStatus !== 'not_attending'),
    [guests, seatedGuestIds]
  );

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [selectedTableId, tables]
  );

  const totals = useMemo(() => {
    const totalSeats = guests
      .filter((g) => g.responseStatus !== 'not_attending')
      .reduce((sum, g) => sum + seatsForGuest(g), 0);
    const seatedSeats = tables.reduce((sum, t) => sum + t.seatsTaken, 0);
    // The stage is not a table. Fixtures share this list but must never be
    // counted in "Столов: N".
    const tableCount = tables.filter((t) => !isHallObject(t.shape)).length;
    return { tables: tableCount, seatedSeats, totalSeats };
  }, [guests, tables]);

  return {
    tables,
    selectedTable,
    selectedTableId,
    setSelectedTableId,
    unassignedGuests,
    guestById,
    totals,
    saveState,
    busy,
    moveTableLocal,
    commitTableMove,
    addTable,
    updateTable,
    deleteTable,
    assignGuest,
  };
}
