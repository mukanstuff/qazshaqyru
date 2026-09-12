'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CanvasElement,
  CanvasElementType,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { CanvasRenderer } from './CanvasRenderer';
import {
  HistoryStack,
  addElement,
  deleteElement,
  deriveMobileDocument,
  duplicateElement,
  moveElement,
  updateElement,
} from '@/lib/canvas/mutations';
import { SelectionChrome } from './SelectionChrome';
import { ElementContextMenu } from './ElementContextMenu';
import { PropertiesPanel } from './PropertiesPanel';
import { EditorSheetTabWizard } from './EditorSheetTabWizard';
import { EditorToolbar } from './EditorToolbar';
import { EditorSheet } from './EditorSheet';
import { EditorSheetTabs, type SheetTabId } from './EditorSheetTabs';
import type { EventType } from '@prisma/client';
import { EditorSheetTabTexts } from './EditorSheetTabTexts';
import { EditorSheetTabPhotos } from './EditorSheetTabPhotos';
import { EditorSheetTabMusic } from './EditorSheetTabMusic';
import { EditorSheetTabSections } from './EditorSheetTabSections';
import { EditorSheetTabLayers } from './EditorSheetTabLayers';
import { EditorSheetTabDesign } from './EditorSheetTabDesign';
import { EditorSheetTabLink } from './EditorSheetTabLink';
import { ElementPalette } from './ElementPalette';
import { useI18n } from '@/i18n';

/**
 * Canvas editor shell.
 *
 *  - `EditorToolbar` — one in-flow top bar (Back / Undo / Redo / Заполнить /
 *    Опубликовать). Not a stack of independently `position: fixed` pills —
 *    those used to overlap each other whenever a label rendered wider than
 *    the pixel offset assumed between them.
 *  - `ElementPalette` — the bottom dock: scrollable category chips plus the
 *    quick-edit button, in one floating bar. Tapping a chip opens a sheet
 *    of elements/ready-made sections to insert.
 *  - Selected element / document settings: `PropertiesPanel` — a bottom
 *    sheet over the canvas.
 *  - Doc-level settings (fill / texts / photos / music / sections / design)
 *    live in the `EditorSheet` opened from the dock's quick-edit button.
 *
 * One layout at every width: no docked side rails, no desktop-only
 * interaction model. Wide screens get the same chrome with more room around
 * it, and the sheets grow into centered floating cards rather than turning
 * into something structurally different.
 *
 *  - Quality-of-life: undo/redo, autosave with 1 s debounce, flush on
 *    `beforeunload`/`pagehide`/`visibilitychange` via `keepalive: true`.
 */

export interface SaveRequestOptions {
  keepalive?: boolean;
}

export interface CanvasEditorProps {
  initialDocument: InvitationCanvasDocument;
  onChange?: (doc: InvitationCanvasDocument) => void;
  onSaveRequest?: (doc: InvitationCanvasDocument, options?: SaveRequestOptions) => Promise<void>;
  shareUrl?: string;
  locale?: 'ru' | 'kz';
  mode?: 'user' | 'template-builder';
  templateId?: string;
  /** Used by the wizard sheet to call applyWizardToCanvasDocument. */
  templateKey?: string;
  editorMode?: 'admin' | 'guest';
  /**
   * Owner's invitation id. Required for the Publish button to navigate to
   * the hub (/invitations/[id]?published=1) after the user finishes editing.
   * Without this, Publish can only fall back to /dashboard.
   */
  invitationId?: string;
  /** Current public slug (e.g. "aidar-and-aigerim") — no leading /i/. */
  invitationSlug?: string;
  /** Template price paid = full access, incl. custom link. Same gate the hub uses. */
  fullAccess?: boolean;
  /** Invitation event type — drives the ready-made greetings in the Texts tab.
   *  Absent in the template builder, which has no invitation behind it. */
  eventType?: EventType;
  /** Shown on the locked-link hint when !fullAccess. */
  priceKzt?: number;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function CanvasEditor(props: CanvasEditorProps) {
  const {
    initialDocument,
    onChange,
    onSaveRequest,
    shareUrl,
    locale = 'ru',
    mode = 'user',
    templateId,
    templateKey,
    editorMode = 'admin',
    invitationId,
    invitationSlug,
    fullAccess = false,
    eventType,
    priceKzt = 3990,
  } = props;
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  const [slug, setSlug] = useState(invitationSlug ?? '');
  useEffect(() => {
    if (invitationSlug !== undefined) setSlug(invitationSlug);
  }, [invitationSlug]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  /**
   * Which tab the quick-edit sheet opens on. The FAB ("Быстрая правка")
   * and the toolbar's "Заполнить" button both open the same sheet — one
   * used to be a separate wizard sheet, which read as two competing
   * "edit stuff" menus with overlapping fields (both could edit couple
   * names). Folding the wizard form into the sheet's first tab keeps two
   * entry points but only one sheet to reason about.
   */
  const [quickEditInitialTab, setQuickEditInitialTab] = useState<SheetTabId>('texts');
  /**
   * PropertiesPanel visibility. The panel decides its own rail-vs-sheet
   * layout internally; this just tracks whether it should be open at all.
   */
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // The two editor sheets occupy the same slot at the bottom of the screen.
  // While they were modal that was academic — the overlay made the other one
  // unreachable. Non-modal they can genuinely both be open and stack on top of
  // one another, so opening either now closes the other.
  const handleOpenQuickEdit = useCallback(() => {
    setQuickEditInitialTab('texts');
    setInspectorOpen(false);
    setQuickEditOpen(true);
  }, []);

  const { t } = useI18n();

  const historyRef = useRef<HistoryStack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  if (!historyRef.current) historyRef.current = new HistoryStack(initialDocument);

  const prevTemplateId = useRef<string | null>(null);
  useEffect(() => {
    if (prevTemplateId.current !== null && prevTemplateId.current !== templateId) {
      setDoc(initialDocument);
      historyRef.current = new HistoryStack(initialDocument);
    }
    prevTemplateId.current = templateId ?? null;
  }, [initialDocument, templateId]);

  const commit = useCallback(
    (next: InvitationCanvasDocument) => {
      historyRef.current!.pushSnapshot(next);
      setDoc(next);
      onChange?.(next);
    },
    [onChange]
  );

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; el: CanvasElement } | null>(null);

  // Autosave with 1s debounce.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<InvitationCanvasDocument | null>(null);
  const scheduleSave = useCallback(
    (d: InvitationCanvasDocument) => {
      pendingSaveRef.current = d;
      if (!onSaveRequest) return;
      setSaveState('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        saveTimer.current = null;
        const payload = pendingSaveRef.current;
        if (!payload) return;
        pendingSaveRef.current = null;
        try {
          await onSaveRequest(payload);
          setSaveState('saved');
          setSavedToastVisible(true);
          setSaveErrorMessage(null);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => {
            setSavedToastVisible(false);
            toastTimer.current = null;
          }, 1500);
        } catch {
          setSaveState('error');
          setSaveErrorMessage(t('invitation.edit.canvas.saveError'));
          pendingSaveRef.current = payload;
        }
      }, 1000);
    },
    [onSaveRequest, t]
  );

  // Flush pending save on tab close / hide.
  useEffect(() => {
    if (!onSaveRequest) return;
    const flush = () => {
      const payload = pendingSaveRef.current;
      if (!payload) return;
      pendingSaveRef.current = null;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      void onSaveRequest(payload, { keepalive: true }).catch(() => {});
    };
    const handleBeforeUnload = () => flush();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const handlePageHide = () => flush();
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onSaveRequest]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
        toastTimer.current = null;
      }
    };
  }, []);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    scheduleSave(doc);
  }, [doc, scheduleSave]);

  const selected = useMemo(
    () => doc.elements.find((e) => e.id === selectedId) || null,
    [doc.elements, selectedId]
  );

  // Hotkeys.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isTyping) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = historyRef.current!.undo();
        if (prev) setDoc(prev);
        return;
      }
      if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        const next = historyRef.current!.redo();
        if (next) setDoc(next);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // A locked element is locked against the keyboard too, or the lock is
        // only a lock against the mouse.
        if (doc.elements.find((el) => el.id === selectedId)?.locked) return;
        e.preventDefault();
        const next = deleteElement(doc, selectedId);
        setSelectedId(null);
        commit(next);
        return;
      }
      if (e.key === 'Escape') {
        if (quickEditOpen) {
          setQuickEditOpen(false);
          return;
        }
        if (inspectorOpen) {
          setInspectorOpen(false);
          return;
        }
        if (selectedId) setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, selectedId, quickEditOpen, inspectorOpen, commit]);

  const handleUpdateSelected = useCallback(
    (patch: Partial<CanvasElement>) => {
      if (!selectedId) return;
      const next = updateElement(doc, selectedId, patch);
      commit(next);
    },
    [doc, selectedId, commit]
  );

  const handleTextChange = useCallback(
    (id: string, patch: { text: string }) => {
      setDoc((d) => updateElement(d, id, patch as Partial<CanvasElement>));
    },
    []
  );

  const handleTextPatch = useCallback(
    (id: string, patch: Partial<CanvasElement>) => {
      setDoc((d) => {
        const next = updateElement(d, id, patch);
        historyRef.current!.pushSnapshot(next);
        return next;
      });
    },
    []
  );

  const handleStartTextEdit = useCallback((id: string) => {
    setSelectedId(id);
    setEditingTextId(id);
  }, []);

  const handleStopTextEdit = useCallback((_id: string) => {
    setEditingTextId(null);
  }, []);

  /**
   * Tapping an element on the canvas only selects it (shows resize/rotate/
   * drag handles) — it does not open the properties sheet. The sheet is a
   * modal (see PropertiesPanel.tsx): opening it automatically on every
   * select used to make the just-selected element completely undraggable,
   * since the modal overlay swallows every pointer event on the canvas
   * behind it, even where nothing is visually covered. Opening it is now a
   * deliberate second action — see handleOpenProperties, wired to the
   * sliders button SelectionChrome shows once an element is selected.
   */
  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      // Selecting something else (or nothing) always ends any active text
      // edit session. This is a deliberate invariant, not just a consequence
      // of blur: DOM focus can end up stranded independently of React's
      // `editing` state (found via the colour popover — its swatch buttons
      // take focus on mousedown, and closing the popover unmounts that
      // focused button with nothing to hand focus to, leaving `editingTextId`
      // stuck pointing at an element that no longer looks selected). Clearing
      // it here whenever selection actually changes closes that class of bug
      // at the source instead of chasing every place focus could get lost.
      if (editingTextId && id !== editingTextId) {
        setEditingTextId(null);
      }
    },
    [editingTextId]
  );

  const handleOpenProperties = useCallback((id: string) => {
    setSelectedId(id);
    setQuickEditOpen(false);
    setInspectorOpen(true);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    const next = deleteElement(doc, selectedId);
    setSelectedId(null);
    setInspectorOpen(false);
    commit(next);
  }, [doc, selectedId, commit]);

  /**
   * Add a new element of the given type. Stacks it below the bottom of the
   * existing canvas so repeated clicks don't pile everything on top of
   * each other, then selects it and opens the inspector.
   */
  const handleAddElement = useCallback(
    (type: CanvasElementType) => {
      const lastBottom = doc.elements.reduce(
        (max, el) => Math.max(max, el.y + (typeof el.h === 'number' ? el.h : 0)),
        0,
      );
      const next = addElement(doc, type, { y: lastBottom + 12 });
      const added = next.elements[next.elements.length - 1];
      commit(next);
      if (added) {
        setSelectedId(added.id);
        setQuickEditOpen(false);
        setInspectorOpen(true);
      }
    },
    [doc, commit],
  );

  const handleInsertSection = useCallback(
    (nextDoc: InvitationCanvasDocument) => {
      commit(nextDoc);
    },
    [commit],
  );

  /**
   * On every drag move, update position without a history snapshot (perf);
   * the final commit() happens in the drag-end handlers below.
   */
  const handleElementPositionChange = useCallback(
    (id: string, pos: { x?: number; y?: number }) => {
      setDoc((prev) => updateElement(prev, id, pos));
    },
    [],
  );

  const handleElementResize = useCallback(
    (id: string, dim: { w?: number; h?: number | 'auto' }) => {
      setDoc((prev) => updateElement(prev, id, dim));
    },
    [],
  );

  const handleElementRotate = useCallback(
    (id: string, rotation: number) => {
      // Normalise to 0–360.
      const normalized = ((rotation % 360) + 360) % 360;
      setDoc((prev) => updateElement(prev, id, { rotation: normalized }));
    },
    [],
  );

  /**
   * Commit the current (dragged/resized/rotated) document to history after
   * a drag/resize/rotate session ends. CanvasRenderer fires this via its
   * mutation callbacks.
   */
  const commitCurrentDoc = useCallback(
    (_id: string) => {
      commit(doc);
    },
    [doc, commit],
  );

  const handleDuplicateSelected = useCallback(() => {
    if (!selected) return;
    const next = duplicateElement(doc, selected.id);
    commit(next);
    setSelectedId(next.elements.find((e) => e.id !== selected.id)?.id ?? null);
  }, [doc, selected, commit]);

  const handleLayerSelected = useCallback(
    (dir: 'front' | 'back' | 'forward' | 'backward') => {
      if (!selected) return;
      commit(moveElement(doc, selected.id, dir));
    },
    [doc, selected, commit],
  );

  /** Closing the panel leaves the element selected (handles still visible,
   * draggable again now the modal overlay is gone) — selection and the
   * properties sheet are independent states now. */
  const handleCloseInspector = useCallback(() => {
    setInspectorOpen(false);
  }, []);
  const isGuest = editorMode === 'guest';

  /**
   * Auto-open the wizard the first time this invitation is opened in the
   * editor — i.e. right after picking a template, with no redirect: the
   * wizard is just the first tab of the same in-editor sheet.
   *
   * This used to fire based on whether placeholder-bound elements (couple
   * names, date, venue...) still held empty text. That heuristic never
   * actually fired for a real template: every real template ships with
   * realistic sample copy already filled in ("Айдар және Айсұлу", a sample
   * date, a sample venue) so a new user sees what the invitation will look
   * like — meaning every real template's placeholders read as "already
   * filled" from the very first load, and the wizard never opened. Wired,
   * but the trigger condition it depended on could not occur in practice.
   *
   * The real signal for "first time in the editor" is a persisted flag on
   * the document itself (`editorMetadata.wizardCompletedAt`, stamped by
   * `markWizardDone` below on apply or explicit skip), not localStorage —
   * that only remembers this browser, so reopening the same invitation on
   * another device replayed the wizard every time.
   */
  useEffect(() => {
    if (isGuest || previewMode) return;
    if (!invitationId) return;
    if (doc.editorMetadata?.wizardCompletedAt) return;

    setQuickEditInitialTab('wizard');
    setQuickEditOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId, isGuest, previewMode]);

  const markWizardDone = useCallback(
    (next: InvitationCanvasDocument): InvitationCanvasDocument => ({
      ...next,
      editorMetadata: {
        ...(next.editorMetadata ?? { lastModifiedAt: new Date().toISOString() }),
        wizardCompletedAt: new Date().toISOString(),
      },
    }),
    []
  );

  const handleWizardApply = useCallback(
    (next: InvitationCanvasDocument) => commit(markWizardDone(next)),
    [commit, markWizardDone]
  );

  // Closing the quick-edit sheet for any reason (X, backdrop, switching to
  // another tab and closing from there) counts as "seen" even if the user
  // never applied the wizard — otherwise it would auto-reopen every single
  // time they re-enter the editor.
  const quickEditWasOpen = useRef(false);
  useEffect(() => {
    if (quickEditOpen) {
      quickEditWasOpen.current = true;
      return;
    }
    if (quickEditWasOpen.current) {
      quickEditWasOpen.current = false;
      if (!doc.editorMetadata?.wizardCompletedAt) commit(markWizardDone(doc));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickEditOpen]);
  // Adaptive stage width.
  // Mobile (<768px): fill the screen edge to edge — see the scale transform
  // below.
  // Tablet (768-1024): 520px — wider for better tap targets on elements.
  // Desktop (≥1024): 390px (matches the invitation canvas design width for consistency).
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const stageWidth = viewportWidth < 768 ? 360 : viewportWidth < 1024 ? 520 : 390;
  const effectiveDoc = useMemo(() => deriveMobileDocument(doc), [doc]);

  /**
   * On phones, the canvas renders at its own design width (`effectiveDoc.width`,
   * usually 390) and gets scaled up via CSS transform to fill the actual
   * screen — rather than stretching the document's percent-based layout to a
   * wider box, which would leave every absolute-px value (font sizes, border
   * radii, icon sizes) looking proportionally smaller than designed. A
   * uniform `transform: scale()` keeps everything in proportion, the same
   * technique Figma/Canva use to fit a fixed-size canvas to the viewport.
   *
   * `transform` doesn't change the element's box for layout purposes, so the
   * *wrapper* needs an explicit scaled width/height reserved for it — width
   * is just `viewportWidth`, but height depends on content, so it's measured
   * off the unscaled render via ResizeObserver.
   */
  const isMobileStage = viewportWidth < 768;
  const stageScale = isMobileStage ? viewportWidth / effectiveDoc.width : 1;
  const naturalStageWidth = isMobileStage ? effectiveDoc.width : stageWidth;
  const [naturalStageHeight, setNaturalStageHeight] = useState(600);
  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const measure = () => setNaturalStageHeight(node.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
    // Mount-once: ResizeObserver already reacts to any future size change
    // (new elements, edits, locale swaps) without needing to be re-attached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Keep the thing you are editing where you can see it.
   *
   * The inspector and the quick-edit sheet are no longer modal (they no longer
   * dim or block the canvas), but on a phone they still occupy the bottom half
   * of the screen. Selecting an element near the fold and opening its panel
   * would therefore still hide it. This scrolls the stage so the selection
   * sits in the strip that stays visible — and only when the panel actually
   * overlaps the stage horizontally.
   *
   * Inspector only. Quick edit is a centred modal now, so there is no strip
   * left to scroll the selection into and nothing behind it can be touched.
   */
  useEffect(() => {
    if (!inspectorOpen || !selectedId) return;
    const wrap = stageWrapRef.current;
    if (!wrap) return;

    // Measure after the sheet's enter animation, or the sheet is still
    // off-screen and its top edge reads as the bottom of the viewport.
    const timer = window.setTimeout(() => {
      const node = wrap.querySelector<HTMLElement>(
        `[data-selected-id="${CSS.escape(selectedId)}"]`,
      );
      const sheet = window.document.querySelector<HTMLElement>('[data-canvas-sheet="inspector"]');
      if (!node || !sheet) return;

      const sheetRect = sheet.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const overlapsHorizontally =
        sheetRect.left < nodeRect.right && sheetRect.right > nodeRect.left;
      if (!overlapsHorizontally) return;

      const margin = 16;
      const topLimit = Math.max(wrap.getBoundingClientRect().top, 0) + margin;
      const bottomLimit = sheetRect.top - margin;
      if (bottomLimit <= topLimit) return;

      let delta = 0;
      if (nodeRect.bottom > bottomLimit) delta = nodeRect.bottom - bottomLimit;
      // Never push the top of the element above the visible strip: seeing
      // where a block starts matters more than seeing where it ends.
      if (nodeRect.top - delta < topLimit) delta = nodeRect.top - topLimit;
      if (Math.abs(delta) < 2) return;
      wrap.scrollBy({ top: delta, behavior: 'smooth' });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [inspectorOpen, selectedId]);

  /*
   * Publish the stage's own viewport height.
   *
   * Pinned chrome — the floating music toggle — sticks to a corner of what the
   * host can currently see, and CSS has no unit for "the height of this
   * scrollport". Without it the control anchors to the bottom of the document
   * instead, 5600px down. See the pinned branch of elementStyle.
   */
  useEffect(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return;
    const publish = () => wrap.style.setProperty('--stage-vh', `${wrap.clientHeight}px`);
    publish();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(publish);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  }, []);

  const router = useRouter();

  const handlePublish = useCallback(() => {
    // Force-flush pending save so the hub sees the latest doc.
    if (onSaveRequest && pendingSaveRef.current) {
      void onSaveRequest(pendingSaveRef.current).catch(() => {});
    }
    // This button ("Готово"/"Дайын") only leaves the editor — it does NOT
    // publish anything. Actually publishing (free-with-watermark or paid)
    // is a real, separate action the hub itself owns (HubSectionList's
    // publishFree/upgrade). Previously this pushed `?published=1`, which
    // makes the hub show "Invitation published!" even for an untouched
    // draft — a false success message sitting right above its own pay wall.
    if (invitationId) {
      router.push(`/invitations/${encodeURIComponent(invitationId)}`);
    } else {
      router.push('/dashboard');
    }
  }, [onSaveRequest, invitationId, router]);

  return (
    <div
      className="canvas-editor-shell flex h-full flex-col"
      data-editor-mode={editorMode}
      data-preview-mode={previewMode ? 'on' : 'off'}
    >
      {/* Top controls — floating over the canvas, admin only, hidden in
          preview/guest. See EditorToolbar.tsx for why it's not an in-flow
          header. */}
      {!isGuest && !previewMode && (
        <EditorToolbar
          canUndo={historyRef.current?.canUndo() ?? false}
          canRedo={historyRef.current?.canRedo() ?? false}
          onUndo={() => {
            const p = historyRef.current!.undo();
            if (p) setDoc(p);
          }}
          onRedo={() => {
            const p = historyRef.current!.redo();
            if (p) setDoc(p);
          }}
          // Template-builder hosts its own back + save controls in the same
          // top corners (TemplateBuilderClient's header) — rendering these
          // here too would float directly on top of them.
          onBack={mode === 'template-builder' ? undefined : handleBack}
          onPublish={mode === 'template-builder' ? undefined : handlePublish}
        />
      )}

      {/* Save toast — short-lived indicator. Lives in CanvasEditor (not
          EditorToolbar) because it's transient UI, not chrome. */}
      {!isGuest && !previewMode && savedToastVisible && (
        <div
          className="editor-saved-toast"
          role="status"
          aria-live="polite"
          data-testid="canvas-saved-toast"
        >
          ✓ {t('invitation.edit.canvas.saved')}
        </div>
      )}
      {!isGuest && !previewMode && saveErrorMessage && (
        <button
          type="button"
          className="editor-saved-toast editor-saved-toast--error"
          onClick={() => {
            setSaveErrorMessage(null);
            scheduleSave(doc);
          }}
          data-testid="canvas-saved-error"
        >
          ⚠ {saveErrorMessage}
        </button>
      )}

      {/* Canvas — the only in-flow content in the whole shell. Toolbar, dock,
          and every sheet float above it (see canvas-editor.css for their
          fixed positioning and the clearance padding below), so the stage
          always gets the full viewport to fill rather than whatever's left
          over after side panels or an in-flow header. */}
      <div
        ref={stageWrapRef}
        className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-0 md:px-6 canvas-stage-wrap"
        data-testid="canvas-stage-wrap"
        onClick={(e) => {
          // Deselect when the click lands on the grey margin around the
          // stage, not on the stage or an element. CanvasRenderer already
          // deselects for a click on the stage background itself, but that
          // listener only covers the stage element's own area — clicking
          // outside the template (the padding this wrapper adds around it)
          // never reached any deselect handler at all, so the selection
          // outline and inspector stayed open no matter where else you clicked.
          if (e.target === e.currentTarget && selectedId) handleSelect(null);
        }}
      >
        <div
          className="relative shadow-2xl"
          style={
            isMobileStage
              ? { width: viewportWidth, height: naturalStageHeight * stageScale }
              : { width: stageWidth }
          }
        >
          <div
            ref={stageRef}
            style={{
              width: naturalStageWidth,
              transform: isMobileStage ? `scale(${stageScale})` : undefined,
              transformOrigin: 'top left',
            }}
          >
            <CanvasRenderer
              ref={previewRef}
              document={effectiveDoc}
              mode="editor"
              selectedId={selectedId}
              onSelect={isGuest || previewMode ? undefined : handleSelect}
              editingTextId={editingTextId}
              onStartTextEdit={handleStartTextEdit}
              onStopTextEdit={handleStopTextEdit}
              onTextChange={handleTextChange}
              onTextPatch={handleTextPatch}
              // A single click selects (so it can be dragged, matching every
              // other element type); a double click enters text edit. It used
              // to be the reverse — the very first click already opened the
              // caret, so there was no way to grab and move the block without
              // first clicking empty space to deselect it.
              editingTrigger="double"
              onElementPositionChange={handleElementPositionChange}
              onElementResize={handleElementResize}
              onElementRotate={handleElementRotate}
              onElementDragEnd={commitCurrentDoc}
              renderEditorShell={
                isGuest || previewMode
                  ? (_el, children) => <>{children}</>
                  : (el, children, _cw, callbacks) => (
                      <SelectionChrome
                        el={el}
                        canvasWidth={effectiveDoc.width}
                        stageRef={stageRef}
                        selected={el.id === selectedId}
                        // While the caret is in this element's text, the
                        // pointer belongs to the text: dragging must be off so
                        // a mouse sweep selects words instead of moving the
                        // block.
                        editing={el.id === editingTextId}
                        onTap={() => handleSelect(el.id)}
                        onEditProperties={() => handleOpenProperties(el.id)}
                        onDelete={() => {
                          const next = deleteElement(doc, el.id);
                          if (selectedId === el.id) setSelectedId(null);
                          commit(next);
                        }}
                        onPositionChange={(pos) => callbacks.onPositionChange(el.id, pos)}
                        onResize={(dim) => callbacks.onResize(el.id, dim)}
                        onRotate={(rot) => callbacks.onRotate(el.id, rot)}
                        onContextMenu={(e) => setContextMenu({ x: e.clientX, y: e.clientY, el })}
                        locale={locale}
                      >
                        {children}
                      </SelectionChrome>
                    )
              }
              shareUrl={shareUrl}
              // The invitation's own language, not the host's interface
              // language: renderer-supplied labels (calendar month and weekday
              // names, RSVP buttons, countdown units) must match the words
              // already on the canvas. Editing a Kazakh design in a Russian UI
              // otherwise previewed a calendar reading "МАЙ / ПН ВТ СР" that
              // the guest would never see.
              locale={doc.locale ?? locale}
            />
          </div>
        </div>
      </div>

      <PropertiesPanel
        key={selected?.id ?? 'document'}
        open={inspectorOpen}
        selected={selected}
        onUpdate={handleUpdateSelected}
        onDelete={handleDeleteSelected}
        onDuplicate={handleDuplicateSelected}
        onLayer={handleLayerSelected}
        locale={locale}
        mode="user"
        document={doc}
        onDocumentChange={(patch) => commit({ ...doc, ...patch })}
        onClose={handleCloseInspector}
      />

      {/* Bottom dock — category chips + quick-edit, one bar at every width
          (see ElementPalette.tsx). Floats over the stage rather than taking
          layout space from it. */}
      {!isGuest && !previewMode && (
        <ElementPalette
          locale={locale}
          document={doc}
          onAdd={handleAddElement}
          onInsertSection={handleInsertSection}
          onOpenQuickEdit={handleOpenQuickEdit}
        />
      )}

      {contextMenu && (
        <ElementContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={contextMenu.el}
          onDuplicate={() => {
            commit(duplicateElement(doc, contextMenu.el.id));
          }}
          onDelete={() => {
            const next = deleteElement(doc, contextMenu.el.id);
            if (selectedId === contextMenu.el.id) setSelectedId(null);
            commit(next);
          }}
          onBringToFront={() => {
            commit(moveElement(doc, contextMenu.el.id, 'front'));
          }}
          onSendToBack={() => {
            commit(moveElement(doc, contextMenu.el.id, 'back'));
          }}
          onToggleLock={() => {
            const next = updateElement(doc, contextMenu.el.id, { locked: !contextMenu.el.locked });
            commit(next);
          }}
          onToggleHide={() => {
            const next = updateElement(doc, contextMenu.el.id, { hidden: !contextMenu.el.hidden });
            commit(next);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {previewMode && !isGuest && (
        <button
          type="button"
          onClick={() => setPreviewMode(false)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] rounded-full bg-us-ink px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-us-ink/90"
          data-testid="canvas-exit-preview"
        >
          ✏ {t('invitation.edit.canvas.backToEdit')}
        </button>
      )}

      {/* Quick-edit sheet — opened from the dock's quick-edit button. */}
      {!isGuest && !previewMode && (
        <EditorSheet
          open={quickEditOpen}
          onClose={() => setQuickEditOpen(false)}
        >
          <EditorSheetTabs
            defaultTab={mode === 'template-builder' && quickEditInitialTab === 'wizard' ? 'texts' : quickEditInitialTab}
            hiddenTabs={mode === 'template-builder' ? ['wizard', 'link'] : undefined}
          >
            {{
              wizard: (
                <EditorSheetTabWizard
                  document={doc}
                  onWizardApply={handleWizardApply}
                  onClose={() => setQuickEditOpen(false)}
                  locale={locale}
                />
              ),
              texts: (
                <EditorSheetTabTexts
                  document={doc}
                  onDocumentChange={commit}
                  eventType={eventType}
                />
              ),
              /* invitationId here — not templateId — on purpose: the upload
                 token route checks it against the Invitation table for
                 ownership, and a Template id is never a valid Invitation id.
                 This used to pass templateId, which made every photo/music
                 upload from the admin template-builder fail with 403
                 ("Нет доступа к этому приглашению") and made every real
                 user's upload lose its invitation association (silently
                 fell back to an unscoped "draft" upload token instead —
                 see /api/upload/token). Template-builder mode has no
                 invitationId to pass, which is fine: requireUploadAccess
                 already allows any logged-in session through when no
                 invitationId is given. */
              photos: (
                <EditorSheetTabPhotos
                  document={doc}
                  invitationId={invitationId}
                  onDocumentChange={commit}
                />
              ),
              music: (
                <EditorSheetTabMusic
                  document={doc}
                  invitationId={invitationId}
                  onDocumentChange={commit}
                />
              ),
              sections: (
                <EditorSheetTabSections
                  document={doc}
                  onDocumentChange={commit}
                />
              ),
              layers: (
                <EditorSheetTabLayers
                  document={doc}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onDocumentChange={commit}
                />
              ),
              design: (
                <EditorSheetTabDesign
                  document={doc}
                  onDocumentChange={commit}
                />
              ),
              link: invitationId ? (
                <EditorSheetTabLink
                  invitationId={invitationId}
                  slug={slug}
                  fullAccess={fullAccess}
                  priceKzt={priceKzt}
                  onSlugChange={setSlug}
                />
              ) : null,
            }}
          </EditorSheetTabs>
        </EditorSheet>
      )}

    </div>
  );
}
