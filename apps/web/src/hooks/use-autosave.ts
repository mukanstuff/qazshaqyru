'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Debounced autosave.
 *
 * Usage:
 *   const { status, lastSavedAt, save } = useAutosave({
 *     value,
 *     delayMs: 1500,
 *     save: async (v) => { await api.update(v); },
 *   });
 *
 * The save function is only invoked `delayMs` after the most recent
 * value change. If the value changes again before the timer fires, the
 * previous timer is cleared. Concurrent saves are queued: if a save is
 * already in flight when the next value arrives, we wait until it
 * completes, then re-save with the freshest value.
 *
 * Status is one of 'idle' | 'pending' | 'saving' | 'saved' | 'error'.
 * Callers can render this directly to give the user feedback.
 */
export interface AutosaveOptions<T> {
  value: T;
  delayMs?: number;
  /** Async saver. Should be idempotent (e.g. PATCH endpoint). */
  save: (value: T) => Promise<void>;
  /** Disable autosave without unmounting (e.g. when form is invalid). */
  enabled?: boolean;
}

export interface AutosaveState {
  status: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  error: Error | null;
  save: () => Promise<void>;
}

export function useAutosave<T>({
  value,
  delayMs = 1500,
  save,
  enabled = true,
}: AutosaveOptions<T>): AutosaveState {
  const [status, setStatus] = useState<AutosaveState['status']>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Keep latest value in a ref so the timer callback can read the fresh
  // version without re-binding the effect every time.
  const valueRef = useRef(value);
  valueRef.current = value;

  // Flag indicating "a save is in flight" so a second change can wait
  // for it to complete before firing its own save.
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const lastSerializedRef = useRef(JSON.stringify(value));
  const mountedRef = useRef(true);

  const doSave = useRef(async () => {
    if (!mountedRef.current) return;
    setStatus('saving');
    try {
      await save(valueRef.current);
      if (!mountedRef.current) return;
      setStatus('saved');
      setLastSavedAt(new Date());
      setError(null);
      lastSerializedRef.current = JSON.stringify(valueRef.current);
    } catch (e) {
      if (!mountedRef.current) return;
      setStatus('error');
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      inFlightRef.current = false;
      // If something changed while we were saving, fire another save.
      if (pendingRef.current && mountedRef.current) {
        pendingRef.current = false;
        scheduleSave();
      }
    }
  }).current;

  const scheduleSave = () => {
    if (!enabled) return;
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    setStatus('pending');
    setTimeout(() => {
      if (!mountedRef.current) return;
      inFlightRef.current = true;
      void doSave();
    }, delayMs);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastSerializedRef.current) return;
    scheduleSave();
    // We intentionally do not include scheduleSave / doSave / valueRef in
    // deps; the refs are stable and valueRef is updated synchronously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, delayMs]);

  return {
    status,
    lastSavedAt,
    error,
    save: async () => {
      if (inFlightRef.current) {
        pendingRef.current = true;
        return;
      }
      inFlightRef.current = true;
      await doSave();
    },
  };
}
