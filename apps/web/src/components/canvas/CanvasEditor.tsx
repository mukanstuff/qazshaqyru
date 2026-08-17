'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasElement, CanvasElementType, InvitationCanvasDocument } from '@/lib/canvas/types';
import { CanvasRenderer } from './CanvasRenderer';
import { HistoryStack, addElement, deleteElement, duplicateElement, moveElement, updateElement, deriveMobileDocument } from '@/lib/canvas/mutations';
import { InspectorPanel } from './InspectorPanel';
import { ElementPalette } from './ElementPalette';
import { EditorToolbar } from './EditorToolbar';
import { GuestCanvasHeader } from './GuestCanvasHeader';
import { SelectionChrome } from './SelectionChrome';
import { ElementContextMenu } from './ElementContextMenu';
import { useDrag } from './hooks/useDrag';
import { useResize } from './hooks/useResize';
import { useRotate } from './hooks/useRotate';
import { snapElementPosition, snapFinal, type GuideLine } from '@/lib/canvas/snap-guides';
import { cn } from '@/lib/shared/utils';
import { useI18n } from '@/i18n';

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
  /** 2026-07-30: chrome controls how much UI is shown.
   * 'full' = complete editor with palette + inspector (default).
   * 'minimal' = stage + basic toolbar only (for "simple view inside editor").
   * This is the start of the "one shell" pattern requested in review.
   */
  chrome?: 'minimal' | 'full';
  /** Template ID — used to reset editor when a different template is loaded.
   * When omitted, the editor only syncs on initial mount (safe for invitations).
   */
  templateId?: string;
  /**
   * 2026-08-14: editorMode controls WHO is at the keyboard.
   *   'admin' (default) — full chrome (toolbar, palette, inspector), double-click to edit text,
   *                       selection chrome with resize/rotate handles.
   *   'guest'           — minimal header (back / save status), single-tap to edit text,
   *                       no selection chrome, no palette, no inspector.
   *
   * Both modes share the same document / autosave / history. This is the first step of the
   * "one engine, two surfaces" plan (see admin/guest split, 2026-08-14).
   */
  editorMode?: 'admin' | 'guest';
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function CanvasEditor(props: CanvasEditorProps) {
  const { initialDocument, onChange, onSaveRequest, shareUrl, locale = 'ru', mode = 'user', chrome = 'full', templateId, editorMode = 'admin' } = props;
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // 2026-08-09: in-place text editing. Only one element can be in edit
  // mode at a time. Cleared automatically when the user clicks outside or
  // hits Esc (handled inside EditableTextView).
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  // 2026-08-17: in-editor guest-view preview toggle.
  // Distinct from editorMode="guest" (a separate visitor surface).
  // When true: chrome is hidden via the chrome prop, selection chrome is
  // suppressed (renderEditorShell becomes a pass-through), selectedId is
  // NOT cleared (so returning to edit preserves the selection).
  const [previewMode, setPreviewMode] = useState(false);

  const historyRef = useRef<HistoryStack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Initialize history once.
  if (!historyRef.current) historyRef.current = new HistoryStack(initialDocument);

  // Sync ONLY on templateId change (e.g. user switches from one template to another).
  // We intentionally do NOT depend on initialDocument here — that would reset the editor
  // every time the parent re-renders with a freshly-fetched copy from autosave.
  const prevTemplateId = useRef<string | null>(null);
  useEffect(() => {
    if (prevTemplateId.current !== null && prevTemplateId.current !== templateId) {
      // Template changed — reload.
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

  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);

  // Autosave with 1s debounce.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clipboardRef = useRef<CanvasElement | null>(null);
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
          setLastSaved(new Date());
        } catch {
          setSaveState('error');
          // Keep the pending doc so the next debounce tick retries
          pendingSaveRef.current = payload;
        }
      }, 1000);
    },
    [onSaveRequest]
  );

  // Flush pending save on tab close / mobile hide. Uses fetch keepalive so the
  // PATCH actually reaches the server before the document is unloaded.
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

  // On unmount (SPA navigation, route change): cancel any pending debounced save.
  // The pagehide/visibilitychange listeners above handle hard shutdown; this
  // closes the SPA-navigation gap where the tab isn't hidden but the component
  // is gone. We do NOT flush here because setState after unmount would warn
  // and the document is about to be re-fetched by the parent.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, []);

  // Trigger autosave on each doc change. Skip the very first run (mount) —
  // scheduling a save with the initial document would PATCH the server with
  // the same payload it just gave us.
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

  // Drag logic.
  const { beginDrag } = useDrag({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    scale: 1,
    docWidth: doc.width,
    getInitial: (id) => {
      const el = doc.elements.find((e) => e.id === id);
      return el ? { x: el.x, y: el.y } : { x: 0, y: 0 };
    },
    onStart: (id) => setSelectedId(id),
    onMove: (id, x, y) => {
      const el = doc.elements.find((e) => e.id === id);
      const res = snapElementPosition(id, x, y, el?.w || 20, typeof el?.h === 'number' ? el.h : 40, doc.elements);
      setActiveGuides(res.guides);
      setDoc((d) => updateElement(d, id, { x: res.x, y: res.y } as Partial<CanvasElement>));
    },
    onEnd: (id, x, y) => {
      setActiveGuides([]);
      const el = doc.elements.find((e) => e.id === id);
      const w = el?.w || 20;
      const h = typeof el?.h === 'number' ? el.h : 40;
      const final = snapFinal(id, x, y, w, h, doc.elements);
      setDoc((d) => {
        const next = updateElement(d, id, { x: final.x, y: final.y } as Partial<CanvasElement>);
        commit(next);
        return next;
      });
    },
  });

  // Resize logic.
  const { beginResize } = useResize({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    scale: 1,
    docWidth: doc.width,
    getInitial: (id) => {
      const el = doc.elements.find((e) => e.id === id);
      return el ? { x: el.x, y: el.y, w: el.w, h: el.h } : { x: 0, y: 0, w: 20, h: 40 };
    },
    onStart: (id) => setSelectedId(id),
    onResize: (id, x, y, w, h) => {
      setDoc((d) => updateElement(d, id, { x, y, w, h } as Partial<CanvasElement>));
    },
    onEnd: (id, x, y, w, h) => {
      setDoc((d) => {
        const next = updateElement(d, id, { x, y, w, h } as Partial<CanvasElement>);
        commit(next);
        return next;
      });
    },
  });

  // Rotate logic.
  const { beginRotate } = useRotate({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    getInitial: (id) => {
      const el = doc.elements.find((e) => e.id === id);
      return el ? { rotation: el.rotation || 0 } : { rotation: 0 };
    },
    onStart: (id) => setSelectedId(id),
    onRotate: (id, angleDeg) => {
      setDoc((d) => updateElement(d, id, { rotation: angleDeg } as Partial<CanvasElement>));
    },
    onEnd: (id, angleDeg) => {
      setDoc((d) => {
        const next = updateElement(d, id, { rotation: angleDeg } as Partial<CanvasElement>);
        commit(next);
        return next;
      });
    },
  });

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
      if (mod && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        const next = duplicateElement(doc, selectedId);
        commit(next);
        return;
      }
      if (mod && e.key.toLowerCase() === 'c' && selectedId) {
        e.preventDefault();
        const el = doc.elements.find((x) => x.id === selectedId);
        if (el) clipboardRef.current = el;
        return;
      }
      if (mod && e.key.toLowerCase() === 'v' && clipboardRef.current) {
        e.preventDefault();
        const src = clipboardRef.current;
        let next = addElement(doc, src.type);
        const newId = next.elements[next.elements.length - 1].id;
        const patch: Partial<CanvasElement> = {
          ...src,
          id: newId,
          x: Math.min(80, src.x + 5),
          y: src.y + 20,
        };
        next = updateElement(next, newId, patch);
        commit(next);
        setSelectedId(newId);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
      if (selectedId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setDoc((d) => {
          const el = d.elements.find((x) => x.id === selectedId);
          if (!el) return d;
          let { x, y } = el;
          if (e.key === 'ArrowLeft') x -= step;
          if (e.key === 'ArrowRight') x += step;
          if (e.key === 'ArrowUp') y -= step;
          if (e.key === 'ArrowDown') y += step;
          x = Math.max(0, Math.min(100, x));
          return updateElement(d, selectedId, { x, y } as Partial<CanvasElement>);
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, selectedId, commit]);

  const handleAdd = useCallback(
    (type: CanvasElementType, xPercent?: number, yPx?: number) => {
      let next = addElement(doc, type);
      const newId = next.elements[next.elements.length - 1].id;
      if (typeof xPercent === 'number' && typeof yPx === 'number') {
        next = updateElement(next, newId, { x: Math.round(xPercent), y: Math.round(yPx) } as Partial<CanvasElement>);
      }
      commit(next);
      setSelectedId(newId);
    },
    [doc, commit]
  );

  // Mini-toolbar callbacks
  const toolbarUndo = useCallback(() => {
    const p = historyRef.current!.undo();
    if (p) setDoc(p);
  }, []);

  const toolbarRedo = useCallback(() => {
    const p = historyRef.current!.redo();
    if (p) setDoc(p);
  }, []);

  const toolbarDuplicate = useCallback(() => {
    if (!selectedId) return;
    const next = duplicateElement(doc, selectedId);
    commit(next);
  }, [doc, selectedId, commit]);

  const toolbarDelete = useCallback(() => {
    if (!selectedId) return;
    const next = deleteElement(doc, selectedId);
    setSelectedId(null);
    commit(next);
  }, [doc, selectedId, commit]);

  const toolbarColorChange = useCallback(
    (color: string) => {
      if (!selectedId) return;
      const el = doc.elements.find((e) => e.id === selectedId);
      if (!el) return;
      let patch: Partial<CanvasElement> = {};
      if ('color' in el) patch = { color } as Partial<CanvasElement>;
      else if ('bgColor' in el) patch = { bgColor: color } as Partial<CanvasElement>;
      else if ('textColor' in el) patch = { textColor: color } as Partial<CanvasElement>;
      else return;
      const next = updateElement(doc, selectedId, patch);
      commit(next);
    },
    [doc, selectedId, commit]
  );

  const toolbarFontSizeChange = useCallback(
    (fontSize: number) => {
      if (!selectedId) return;
      const el = doc.elements.find((e) => e.id === selectedId);
      if (!el || !('fontSize' in el)) return;
      const next = updateElement(doc, selectedId, { fontSize } as Partial<CanvasElement>);
      commit(next);
    },
    [doc, selectedId, commit]
  );

  const handleUpdateSelected = useCallback(
    (patch: Partial<CanvasElement>) => {
      if (!selectedId) return;
      const next = updateElement(doc, selectedId, patch);
      commit(next);
    },
    [doc, selectedId, commit]
  );

  // ── 2026-08-09: in-place text editing callbacks ──────────────────────────
  // Text typing updates the doc WITHOUT a history snapshot — too noisy.
  // The snapshot is pushed on commit (blur/Esc/Enter). Font/color/align
  // patches do push a snapshot because they are discrete user actions.
  const handleTextChange = useCallback(
    (id: string, patch: { text: string }) => {
      setDoc((d) => updateElement(d, id, patch as Partial<CanvasElement>));
    },
    []
  );

  const handleTextPatch = useCallback(
    (id: string, patch: Partial<import('@/lib/canvas/types').TextProps>) => {
      setDoc((d) => {
        const next = updateElement(d, id, patch as Partial<CanvasElement>);
        // Commit (pushes a history snapshot) for discrete property edits.
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

  const stageWidth = 390;
  const effectiveDoc = useMemo(() => deriveMobileDocument(doc), [doc]);

  // 2026-08-17: previewMode is a VISUAL toggle inside admin editor.
  // It piggy-backs on the existing chrome prop (minimal = hide toolbar/palette/inspector)
  // but ONLY flips the chrome — it does NOT change editorMode, selectedId,
  // history, or autosave. Toggle off → editor state is identical.
  const isMinimal = chrome === 'minimal' || previewMode;
  const isGuest = editorMode === 'guest';

  const { t } = useI18n();

  return (
    <div className="canvas-editor-shell flex h-full flex-col" data-editor-mode={editorMode} data-preview-mode={previewMode ? 'on' : 'off'}>
      {/* 2026-08-14: editorMode === 'guest' shows a lightweight header (back / save status / save).
          2026-08-17: Admin keeps the toolbar EXCEPT in previewMode, where the toolbar is
          replaced by a minimal "return to editing" floating button (rendered below). */}
      {isGuest ? (
        <GuestCanvasHeader
          saveState={saveState}
          lastSaved={lastSaved}
          onSaveNow={() => scheduleSave(doc)}
        />
      ) : !previewMode ? (
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
          saveState={saveState}
          lastSaved={lastSaved}
          onSaveNow={() => scheduleSave(doc)}
          mode={mode}
          previewMode={previewMode}
          onTogglePreview={() => setPreviewMode((v) => !v)}
        />
      ) : null}
      {!isMinimal && !isGuest && (
        <div className="md:hidden px-4 py-2 border-b text-xs text-center" role="status" style={{ borderColor: 'var(--ed-border)', background: 'rgba(22, 163, 74, 0.06)', color: 'var(--ed-accent)' }}>
          {t('invitation.edit.canvas.mobileHint')}
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        {/* Hide full palette in minimal chrome OR in guest mode (guest never adds elements) */}
        {!isMinimal && !isGuest && (
          <div className="hidden md:flex" style={{ flexShrink: 0 }}>
            <ElementPalette
              onAdd={handleAdd}
              locale={locale}
              document={doc}
              onInsertSection={(next) => commit(next)}
            />
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 flex items-start justify-center" data-testid="canvas-stage-wrap">
          <div
            className={cn('relative shadow-2xl')}
            style={{
              width: stageWidth,
            }}
          >
            <div
              ref={stageRef}
              style={{
                width: stageWidth,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                if (previewMode || isGuest) return;
                e.preventDefault();
                const type = e.dataTransfer.getData('text/plain') as CanvasElementType;
                if (!type) return;
                const rect = stageRef.current?.getBoundingClientRect();
                if (!rect) return;
                const xPx = e.clientX - rect.left;
                const yPx = e.clientY - rect.top;
                const stagePxPerPercent = rect.width / 100;
                const xPercent = Math.max(0, Math.min(80, xPx / stagePxPerPercent));
                handleAdd(type, xPercent, yPx);
              }}
            >
              <CanvasRenderer
                ref={previewRef}
                document={effectiveDoc}
                mode="editor"
                selectedId={selectedId}
                onSelect={isGuest || previewMode ? undefined : setSelectedId}
                editingTextId={editingTextId}
                onStartTextEdit={handleStartTextEdit}
                onStopTextEdit={handleStopTextEdit}
                onTextChange={handleTextChange}
                onTextPatch={handleTextPatch}
                editingTrigger={isGuest ? 'single' : 'double'}
                renderEditorShell={
                  isGuest || previewMode
                    ? // Guest / previewMode: NO selection chrome, no drag/resize/rotate, no mini-toolbar.
                      (_el, children) => <>{children}</>
                    : (el, children) => (
                        <SelectionChrome
                          el={el}
                          selected={el.id === selectedId}
                          zoom={1}
                          onDragStart={(e) => beginDrag(el.id, e)}
                          onResizeStart={(e, handle) => beginResize(el.id, handle, e)}
                          onRotateStart={(e) => beginRotate(el.id, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedId(el.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, el });
                          }}
                          onToolbarColorChange={toolbarColorChange}
                          onToolbarFontSizeChange={toolbarFontSizeChange}
                          onToolbarDuplicate={toolbarDuplicate}
                          onToolbarDelete={toolbarDelete}
                          onToolbarUndo={toolbarUndo}
                          onToolbarRedo={toolbarRedo}
                        >
                          {children}
                        </SelectionChrome>
                      )
                }
                shareUrl={shareUrl}
                locale={locale}
              />
              {activeGuides.map((g, idx) => (
                <div
                  key={`${g.type}-${idx}`}
                  style={
                    g.type === 'vertical'
                      ? {
                          position: 'absolute',
                          left: `${g.pos}%`,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          backgroundColor: '#c9a961',
                          pointerEvents: 'none',
                          zIndex: 9999,
                        }
                      : {
                          position: 'absolute',
                          top: g.pos,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: '#c9a961',
                          pointerEvents: 'none',
                          zIndex: 9999,
                        }
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2026-08-17: Inspector — desktop sidebar (md+) OR mobile bottom-sheet (<md).
            Bottom-sheet opens when user taps an element; tap on canvas (already handled
            by CanvasRenderer) clears selectedId which auto-closes the sheet via effect. */}
        {!isMinimal && !isGuest && (
          <>
            <div className="hidden md:block" style={{ flexShrink: 0 }}>
              <InspectorPanel
                selected={selected}
                onUpdate={handleUpdateSelected}
                onDelete={() => {
                  if (!selectedId) return;
                  commit(deleteElement(doc, selectedId));
                  setSelectedId(null);
                }}
                onDuplicate={() => {
                  if (!selectedId) return;
                  const next = duplicateElement(doc, selectedId);
                  commit(next);
                }}
                onLayer={(dir) => {
                  if (!selectedId) return;
                  commit(moveElement(doc, selectedId, dir));
                }}
                locale={locale}
                mode={mode}
                document={doc}
                onDocumentChange={(patch) => commit({ ...doc, ...patch })}
              />
            </div>
            <div className="md:hidden">
              {selectedId && (
                <InspectorPanel
                  selected={selected}
                  onUpdate={handleUpdateSelected}
                  onDelete={() => {
                    if (!selectedId) return;
                    commit(deleteElement(doc, selectedId));
                    setSelectedId(null);
                  }}
                  onDuplicate={() => {
                    if (!selectedId) return;
                    const next = duplicateElement(doc, selectedId);
                    commit(next);
                  }}
                  onLayer={(dir) => {
                    if (!selectedId) return;
                    commit(moveElement(doc, selectedId, dir));
                  }}
                  locale={locale}
                  mode={mode}
                  document={doc}
                  onDocumentChange={(patch) => commit({ ...doc, ...patch })}
                  asSheet
                  onClose={() => setSelectedId(null)}
                />
              )}
            </div>
          </>
        )}
      </div>
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
    </div>
  );
}
