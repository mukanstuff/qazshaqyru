'use client';

/**
 * HTML-template editor — state management via React Context + useReducer.
 *
 * Single source of truth for editor state.
 * All panels and the live preview read from / write to this store via useHtmlEditorStore().
 *
 * Features:
 *   - Centralized state with reducer
 *   - Undo/redo history (50 steps)
 *   - Dirty-tracking (isDirty vs savedFields)
 *   - Save status tracking
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import type {
  HtmlEditorFields,
  HtmlEditorMode,
  EditorTab,
  SaveStatus,
  AnimationType,
  RsvpFields,
} from './types';
import type { FieldErrors } from './schemas';

const HISTORY_LIMIT = 50;

// ─── Default factory ──────────────────────────────────────────────────────────

function defaultFields(overrides: Partial<HtmlEditorFields> = {}): HtmlEditorFields {
  return {
    groomName: '',
    brideName: '',
    eventDate: '',
    eventTime: '',
    eventPlace: '',
    address: '',
    greeting: '',
    mapUrl: '',
    whatsappPhone: '',
    backgroundColor: '',
    accentColorMode: 'default',
    accentColor: '#c8a96a',
    animationType: 'fade-in',
    animationDuration: 3.0,
    autoScroll: true,
    showEnvelope: true,
    fontMode: 'template',
    fontFamily: '',
    newTextFontMode: 'environment',
    newTextFontFamily: '',
    musicUrl: '',
    musicStartSec: 0,
    musicEndSec: 180,
    galleryPhotos: [],
    cardTitle: '',
    cardDescription: '',
    cardImageUrl: '',
    slug: '',
    locale: 'ru',
    ...overrides,
  };
}

// ─── State & Action types ──────────────────────────────────────────────────────

interface History {
  past: HtmlEditorFields[];
  future: HtmlEditorFields[];
}

interface State {
  mode: HtmlEditorMode;
  invitationId: string | null;
  templateSlug: string;
  templateName: string;
  fields: HtmlEditorFields;
  savedFields: HtmlEditorFields;
  rsvpFields: RsvpFields;
  activeTab: EditorTab;
  saveStatus: SaveStatus;
  saveError: string | null;
  fieldErrors: FieldErrors;
  isDirty: boolean;
  isPreviewRefreshing: boolean;
  hasUnsavedChanges: boolean;
  history: History;
}

type Action =
  | { type: 'init'; payload: { mode: HtmlEditorMode; invitationId?: string; templateSlug: string; templateName: string; fields?: Partial<HtmlEditorFields>; rsvpFields?: Partial<RsvpFields> } }
  | { type: 'update_field'; key: string; value: unknown; pushHistory?: boolean }
  | { type: 'update_fields'; patch: Partial<HtmlEditorFields>; pushHistory?: boolean }
  | { type: 'update_rsvp'; key: keyof RsvpFields; value: RsvpFields[keyof RsvpFields] }
  | { type: 'set_tab'; tab: EditorTab }
  | { type: 'set_save_status'; status: SaveStatus; error?: string }
  | { type: 'mark_saved'; fields: HtmlEditorFields }
  | { type: 'set_field_errors'; errors: FieldErrors }
  | { type: 'set_preview_refreshing'; refreshing: boolean }
  | { type: 'set_animation'; animType: AnimationType; duration?: number }
  | { type: 'add_gallery_photo'; url: string }
  | { type: 'remove_gallery_photo'; index: number }
  | { type: 'set_music'; url: string; startSec?: number; endSec?: number }
  | { type: 'clear_music' }
  | { type: 'reset_fields' }
  | { type: 'undo' }
  | { type: 'redo' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pushHistory(history: History, fields: HtmlEditorFields): History {
  const past = [...history.past, fields].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init': {
      const defaults = defaultFields({ ...action.payload.fields, locale: action.payload.fields?.locale ?? 'ru' });
      const rsvp = {
        showPhone: action.payload.rsvpFields?.showPhone ?? false,
        showGuestCount: action.payload.rsvpFields?.showGuestCount ?? false,
        showWishes: action.payload.rsvpFields?.showWishes ?? false,
      };
      return {
        ...state,
        mode: action.payload.mode,
        invitationId: action.payload.invitationId ?? null,
        templateSlug: action.payload.templateSlug,
        templateName: action.payload.templateName,
        fields: defaults,
        savedFields: defaults,
        rsvpFields: rsvp,
        activeTab: 'content',
        saveStatus: 'idle',
        saveError: null,
        fieldErrors: {},
        isDirty: false,
        hasUnsavedChanges: false,
        history: { past: [], future: [] },
      };
    }

    case 'update_field': {
      const next = { ...state.fields, [action.key]: action.value } as HtmlEditorFields;
      const isDirty = JSON.stringify(next) !== JSON.stringify(state.savedFields);
      const history = action.pushHistory === false
        ? state.history
        : pushHistory(state.history, state.fields);
      return {
        ...state,
        fields: next,
        isDirty,
        hasUnsavedChanges: isDirty,
        saveStatus: 'idle',
        history,
      };
    }

    case 'update_fields': {
      const next = { ...state.fields, ...action.patch };
      const isDirty = JSON.stringify(next) !== JSON.stringify(state.savedFields);
      const history = action.pushHistory === false
        ? state.history
        : pushHistory(state.history, state.fields);
      return {
        ...state,
        fields: next,
        isDirty,
        hasUnsavedChanges: isDirty,
        saveStatus: 'idle',
        history,
      };
    }

    case 'update_rsvp':
      return {
        ...state,
        rsvpFields: { ...state.rsvpFields, [action.key]: action.value },
      };

    case 'set_tab':
      return { ...state, activeTab: action.tab };

    case 'set_save_status':
      return { ...state, saveStatus: action.status, saveError: action.error ?? null };

    case 'mark_saved':
      return {
        ...state,
        fields: action.fields,
        savedFields: action.fields,
        isDirty: false,
        hasUnsavedChanges: false,
        saveStatus: 'saved',
        saveError: null,
        fieldErrors: {},
        history: { past: [], future: [] },
      };

    case 'set_field_errors':
      return { ...state, fieldErrors: action.errors, saveStatus: 'error' };

    case 'set_preview_refreshing':
      return { ...state, isPreviewRefreshing: action.refreshing };

    case 'set_animation':
      return {
        ...state,
        fields: {
          ...state.fields,
          animationType: action.animType,
          ...(action.duration !== undefined ? { animationDuration: action.duration } : {}),
        },
        isDirty: true,
        hasUnsavedChanges: true,
        history: pushHistory(state.history, state.fields),
      };

    case 'add_gallery_photo': {
      if (state.fields.galleryPhotos.length >= 8) return state;
      return {
        ...state,
        fields: {
          ...state.fields,
          galleryPhotos: [...state.fields.galleryPhotos, action.url],
        },
        isDirty: true,
        hasUnsavedChanges: true,
        history: pushHistory(state.history, state.fields),
      };
    }

    case 'remove_gallery_photo':
      return {
        ...state,
        fields: {
          ...state.fields,
          galleryPhotos: state.fields.galleryPhotos.filter((_, i) => i !== action.index),
        },
        isDirty: true,
        hasUnsavedChanges: true,
        history: pushHistory(state.history, state.fields),
      };

    case 'set_music':
      return {
        ...state,
        fields: {
          ...state.fields,
          musicUrl: action.url,
          ...(action.startSec !== undefined ? { musicStartSec: action.startSec } : {}),
          ...(action.endSec !== undefined ? { musicEndSec: action.endSec } : {}),
        },
        isDirty: true,
        hasUnsavedChanges: true,
        history: pushHistory(state.history, state.fields),
      };

    case 'clear_music':
      return {
        ...state,
        fields: {
          ...state.fields,
          musicUrl: '',
          musicStartSec: 0,
          musicEndSec: 180,
        },
        isDirty: true,
        hasUnsavedChanges: true,
        history: pushHistory(state.history, state.fields),
      };

    case 'reset_fields':
      return {
        ...state,
        fields: defaultFields({ locale: state.fields.locale }),
        isDirty: false,
        hasUnsavedChanges: false,
        fieldErrors: {},
        history: { past: [], future: [] },
      };

    case 'undo': {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const past = state.history.past.slice(0, -1);
      const future = [state.fields, ...state.history.future];
      const isDirty = JSON.stringify(previous) !== JSON.stringify(state.savedFields);
      return {
        ...state,
        fields: previous,
        isDirty,
        hasUnsavedChanges: isDirty,
        saveStatus: 'idle',
        history: { past, future },
      };
    }

    case 'redo': {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const future = state.history.future.slice(1);
      const past = [...state.history.past, state.fields].slice(-HISTORY_LIMIT);
      const isDirty = JSON.stringify(next) !== JSON.stringify(state.savedFields);
      return {
        ...state,
        fields: next,
        isDirty,
        hasUnsavedChanges: isDirty,
        saveStatus: 'idle',
        history: { past, future },
      };
    }

    default:
      return state;
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: State = {
  mode: 'create',
  invitationId: null,
  templateSlug: '',
  templateName: '',
  fields: defaultFields(),
  savedFields: defaultFields(),
  rsvpFields: { showPhone: false, showGuestCount: false, showWishes: false },
  activeTab: 'content',
  saveStatus: 'idle',
  saveError: null,
  fieldErrors: {},
  isDirty: false,
  isPreviewRefreshing: false,
  hasUnsavedChanges: false,
  history: { past: [], future: [] },
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface StoreContextValue {
  state: State;
  init: (opts: { mode: HtmlEditorMode; invitationId?: string; templateSlug: string; templateName: string; fields?: Partial<HtmlEditorFields>; rsvpFields?: Partial<RsvpFields> }) => void;
  updateField: (key: string, value: unknown, pushHistory?: boolean) => void;
  updateFields: (patch: Partial<HtmlEditorFields>, pushHistory?: boolean) => void;
  updateRsvpField: <K extends keyof RsvpFields>(key: K, value: RsvpFields[K]) => void;
  updateSlug: (slug: string) => void;
  setTab: (tab: EditorTab) => void;
  setAnimation: (type: AnimationType, duration?: number) => void;
  addGalleryPhoto: (url: string) => void;
  removeGalleryPhoto: (index: number) => void;
  setMusic: (url: string, startSec?: number, endSec?: number) => void;
  clearMusic: () => void;
  setSaveStatus: (status: SaveStatus, error?: string) => void;
  markSaved: (fields: HtmlEditorFields) => void;
  setFieldErrors: (errors: FieldErrors) => void;
  setPreviewRefreshing: (refreshing: boolean) => void;
  resetFields: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function HtmlEditorStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const value = useMemo<StoreContextValue>(() => {
    const api: StoreContextValue = {
      state,

      init: (opts) => dispatch({ type: 'init', payload: opts }),

      updateField: (key, value, pushHistory) =>
        dispatch({ type: 'update_field', key, value, pushHistory }),

      updateFields: (patch, pushHistory) =>
        dispatch({ type: 'update_fields', patch, pushHistory }),

      updateRsvpField: (key, value) => dispatch({ type: 'update_rsvp', key, value }),

      updateSlug: (slug) => dispatch({ type: 'update_field', key: 'slug', value: slug }),

      setTab: (tab) => dispatch({ type: 'set_tab', tab }),

      setAnimation: (type, duration) =>
        dispatch({ type: 'set_animation', animType: type, duration }),

      addGalleryPhoto: (url) => dispatch({ type: 'add_gallery_photo', url }),

      removeGalleryPhoto: (index) => dispatch({ type: 'remove_gallery_photo', index }),

      setMusic: (url, startSec, endSec) =>
        dispatch({ type: 'set_music', url, startSec, endSec }),

      clearMusic: () => dispatch({ type: 'clear_music' }),

      setSaveStatus: (status, error) =>
        dispatch({ type: 'set_save_status', status, error }),

      markSaved: (fields) => dispatch({ type: 'mark_saved', fields }),

      setFieldErrors: (errors) => dispatch({ type: 'set_field_errors', errors }),

      setPreviewRefreshing: (refreshing) =>
        dispatch({ type: 'set_preview_refreshing', refreshing }),

      resetFields: () => dispatch({ type: 'reset_fields' }),

      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),

      get canUndo() { return stateRef.current.history.past.length > 0; },
      get canRedo() { return stateRef.current.history.future.length > 0; },
    };
    return api;
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHtmlEditorStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useHtmlEditorStore must be used inside HtmlEditorStoreProvider');
  return ctx;
}

/** Shortcut: just the fields — use in panels. */
export function useHtmlEditorFields() {
  const { state } = useHtmlEditorStore();
  return state.fields;
}

export function useHtmlEditorRsvp() {
  const { state } = useHtmlEditorStore();
  return state.rsvpFields;
}

export function useHtmlEditorUi() {
  const { state, canUndo, canRedo } = useHtmlEditorStore();
  return {
    activeTab: state.activeTab,
    saveStatus: state.saveStatus,
    isDirty: state.isDirty,
    invitationId: state.invitationId,
    templateSlug: state.templateSlug,
    templateName: state.templateName,
    mode: state.mode,
    canUndo,
    canRedo,
  };
}

/** Auto-save effect hook. Calls `onSave` whenever `isDirty` flips to true (debounced). */
export function useAutoSave({
  enabled,
  onSave,
  delayMs = 1500,
}: {
  enabled: boolean;
  onSave: () => Promise<void>;
  delayMs?: number;
}) {
  const { state } = useHtmlEditorStore();
  const prevDirty = useRef(state.isDirty);

  useEffect(() => {
    if (!enabled) return;
    if (!state.isDirty) {
      prevDirty.current = false;
      return;
    }
    if (!prevDirty.current) {
      prevDirty.current = true;
      return; // Just became dirty — wait for the next tick
    }
    const t = setTimeout(() => {
      onSave().catch(() => {
        // error surfaced via toast/store
      });
    }, delayMs);
    return () => clearTimeout(t);
  }, [enabled, state.isDirty, state.fields, onSave, delayMs]);
}