'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CanvasElement,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { CanvasRenderer } from './CanvasRenderer';
import {
  HistoryStack,
  deleteElement,
  deriveMobileDocument,
  duplicateElement,
  moveElement,
  updateElement,
} from '@/lib/canvas/mutations';
import { SelectionChrome } from './SelectionChrome';
import { ElementContextMenu } from './ElementContextMenu';
import { ElementSettingsCard } from './ElementSettingsCard';
import { CompactFloatingPanel } from './CompactFloatingPanel';
import { EditorFloatingClusters } from './EditorFloatingClusters';
import { EditorFab } from './EditorFab';
import { EditorSheet } from './EditorSheet';
import { EditorSheetTabs } from './EditorSheetTabs';
import { EditorSheetTabTexts } from './EditorSheetTabTexts';
import { EditorSheetTabPhotos } from './EditorSheetTabPhotos';
import { EditorSheetTabMusic } from './EditorSheetTabMusic';
import { EditorSheetTabSections } from './EditorSheetTabSections';
import { EditorSheetTabDesign } from './EditorSheetTabDesign';
import { useI18n } from '@/i18n';

/**
 * 2026-08-17 (pilot-2): floating-everything chrome.
 *
 *  - NO top toolbar (replaced by `EditorFloatingClusters`).
 *  - NO left palette (this version is for editing pre-made templates ONLY;
 *    adding new blocks lives behind a separate "make your own" mode).
 *  - NO right inspector / sidebar.
 *  - Quick-edit access via a single green FAB at the bottom of the viewport
 *    (see `EditorFab`). Tap opens a bottom sheet with tabbed editors for
 *    texts/photos/music/sections/design (`EditorSheet` + tabs).
 *  - Selected text: thin strip floats above/below the element with
 *    style controls only.
 *  - Selected non-text: `ElementSettingsCard` floats in the lower
 *    half of the viewport, centered, content-sized — NOT fullscreen,
 *    NOT a sidebar.
 *  - NO drag/resize/rotate handles (template vs accidental edit).
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
  editorMode?: 'admin' | 'guest';
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
    editorMode = 'admin',
  } = props;
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [settingsCardOpen, setSettingsCardOpen] = useState(false);

  const { t } = useI18n();

  const historyRef = useRef<HistoryStack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
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
        if (settingsCardOpen) {
          setSettingsCardOpen(false);
          return;
        }
        if (selectedId) setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, selectedId, quickEditOpen, settingsCardOpen, commit]);

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

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    setSettingsCardOpen(false);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    const next = deleteElement(doc, selectedId);
    setSelectedId(null);
    setSettingsCardOpen(false);
    commit(next);
  }, [doc, selectedId, commit]);

  const isGuest = editorMode === 'guest';
  const stageWidth = 390;
  const effectiveDoc = useMemo(() => deriveMobileDocument(doc), [doc]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  }, []);

  const handlePublish = useCallback(() => {
    // Force-flush pending save so the publish action sees the latest doc.
    if (onSaveRequest && pendingSaveRef.current) {
      void onSaveRequest(pendingSaveRef.current).catch(() => {});
    }
    // For this version, publish is a no-op (the share screen is a separate
    // route). The button is wired so the rest of the chrome is honest about
    // what exists.
  }, [onSaveRequest]);

  return (
    <div
      className="canvas-editor-shell flex h-full flex-col"
      data-editor-mode={editorMode}
      data-preview-mode={previewMode ? 'on' : 'off'}
    >
      {/* Top floating clusters — admin only, hidden in preview/guest. */}
      {!isGuest && !previewMode && (
        <EditorFloatingClusters
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
          onBack={handleBack}
          onPublish={handlePublish}
        />
      )}

      {/* Save toast — short-lived indicator above the FAB. Hidden in
          preview/guest. Lives in CanvasEditor (not EditorFloatingClusters)
          because it's transient UI, not chrome. */}
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

      {/* Canvas — center stage, no side panels. */}
      <div
        className="flex-1 overflow-auto p-6 flex items-start justify-center"
        data-testid="canvas-stage-wrap"
      >
        <div
          className="relative shadow-2xl"
          style={{ width: stageWidth }}
        >
          <div
            ref={stageRef}
            style={{ width: stageWidth }}
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
              editingTrigger="single"
              renderEditorShell={
                isGuest || previewMode
                  ? (_el, children) => <>{children}</>
                  : (el, children) => (
                      <SelectionChrome
                        el={el}
                        selected={el.id === selectedId}
                        onTap={() => handleSelect(el.id)}
                        onDelete={() => {
                          const next = deleteElement(doc, el.id);
                          if (selectedId === el.id) setSelectedId(null);
                          commit(next);
                        }}
                      >
                        {children}
                      </SelectionChrome>
                    )
              }
              shareUrl={shareUrl}
              locale={locale}
            />
          </div>
        </div>
      </div>

      {/* Settings UI — Bug #4 unified pattern: every selected element gets
          the thin floating toolbar (TextStripAnchor). Per-type extras that
          don't fit in the strip live in ElementSettingsCard, opened by the
          cog button in the strip ("more settings" drill-down). */}
      {!isGuest && !previewMode && selected && !settingsCardOpen && (
        <TextStripAnchor
          el={selected}
          onUpdate={handleUpdateSelected}
          onDelete={handleDeleteSelected}
          onOpenSettings={() => setSettingsCardOpen(true)}
        />
      )}

      {!isGuest && !previewMode && selected && settingsCardOpen && (
        <ElementSettingsCard
          key={`settings-${selected.id}`}
          el={selected}
          onUpdate={handleUpdateSelected}
          onDelete={handleDeleteSelected}
          onClose={() => setSettingsCardOpen(false)}
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

      {/* Quick-edit FAB + bottom sheet — admin only, hidden in preview/guest. */}
      {!isGuest && !previewMode && !quickEditOpen && (
        <EditorFab onClick={() => setQuickEditOpen(true)} />
      )}
      {!isGuest && !previewMode && (
        <EditorSheet
          open={quickEditOpen}
          onClose={() => setQuickEditOpen(false)}
        >
          <EditorSheetTabs>
            {{
              texts: (
                <EditorSheetTabTexts
                  document={doc}
                  onDocumentChange={commit}
                />
              ),
              photos: (
                <EditorSheetTabPhotos
                  document={doc}
                  invitationId={templateId}
                  onDocumentChange={commit}
                />
              ),
              music: (
                <EditorSheetTabMusic
                  document={doc}
                  invitationId={templateId}
                  onDocumentChange={commit}
                />
              ),
              sections: (
                <EditorSheetTabSections
                  document={doc}
                  onDocumentChange={commit}
                />
              ),
              design: <EditorSheetTabDesign />,
            }}
          </EditorSheetTabs>
        </EditorSheet>
      )}
    </div>
  );
}

/**
 * Anchor wrapper for CompactFloatingPanel (measures the element's rect
 * after layout so the strip can position itself above/below).
 *
 * Now accepts any CanvasElement (was: text/heading only). Bug #4 unified
 * selection UI so every element type uses the same thin floating strip
 * above/below it.
 */
function TextStripAnchor({
  el,
  onUpdate,
  onDelete,
  onOpenSettings,
}: {
  el: CanvasElement;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onOpenSettings?: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const measure = () => {
      const node = window.document.querySelector(
        `[data-selected-id="${el.id}"]`
      ) as HTMLElement | null;
      if (node) setRect(node.getBoundingClientRect());
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const id = window.requestAnimationFrame(measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      window.cancelAnimationFrame(id);
    };
  }, [el.id]);

  if (!rect) return null;
  return (
    <CompactFloatingPanel
      el={el}
      anchorRect={rect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onOpenSettings={onOpenSettings}
    />
  );
}
