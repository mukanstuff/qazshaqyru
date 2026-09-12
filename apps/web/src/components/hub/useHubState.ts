'use client';

import { useState, useCallback } from 'react';

export type HubSheetKey =
  | 'share'
  | 'texts'
  | 'dates'
  | 'music'
  | 'template'
  | 'reminders'
  | 'guests'
  | 'archive';

export interface HubState {
  activeSheet: HubSheetKey | null;
  openSheet: (key: HubSheetKey) => void;
  closeSheet: () => void;
}

/**
 * 2026-08-18 (Phase 2, hub screen): tiny shared state for the hub.
 * Tracks which sheet is open. One active sheet at a time — opening another
 * swaps without animation flicker.
 */
export function useHubState(): HubState {
  const [activeSheet, setActiveSheet] = useState<HubSheetKey | null>(null);

  const openSheet = useCallback((key: HubSheetKey) => setActiveSheet(key), []);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  return { activeSheet, openSheet, closeSheet };
}