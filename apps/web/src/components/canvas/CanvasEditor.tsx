'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasElement, CanvasElementType, InvitationCanvasDocument } from '@/lib/canvas/types';
import { CanvasRenderer } from './CanvasRenderer';
import { HistoryStack, addElement, deleteElement, duplicateElement, moveElement, updateElement, deriveMobileDocument } from '@/lib/canvas/mutations';
import { InspectorPanel } from './InspectorPanel';
import { ElementPalette } from './ElementPalette';
import { EditorToolbar } from './EditorToolbar';
import { SelectionChrome } from './SelectionChrome';
import { ElementContextMenu } from './ElementContextMenu';
import { PresetLibraryModal } from './PresetLibraryModal';
import { useDrag } from './hooks/useDrag';
import { useResize } from './hooks/useResize';
import { useRotate } from './hooks/useRotate';
import { snapElementPosition, type GuideLine } from '@/lib/canvas/snap-guides';
import { cn } from '@/lib/shared/utils';

export interface CanvasEditorProps {
  initialDocument: InvitationCanvasDocument;
  onChange?: (doc: InvitationCanvasDocument) => void;
  onSaveRequest?: (doc: InvitationCanvasDocument) => Promise<void>;
  shareUrl?: string;
  locale?: 'ru' | 'kz';
  mode?: 'user' | 'template-builder';
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function CanvasEditor(props: CanvasEditorProps) {
  const { initialDocument, onChange, onSaveRequest, shareUrl, locale = 'ru', mode = 'user' } = props;
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>('mobile');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [previewAnim, setPreviewAnim] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const historyRef = useRef<HistoryStack | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Initialize history once.
  if (!historyRef.current) historyRef.current = new HistoryStack(initialDocument);

  useEffect(() => {
    // Sync incoming prop changes (e.g. from server refetch).
    setDoc(initialDocument);
    historyRef.current = new HistoryStack(initialDocument);
  }, [initialDocument]);

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
  const scheduleSave = useCallback(
    (d: InvitationCanvasDocument) => {
      if (!onSaveRequest) return;
      setSaveState('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await onSaveRequest(d);
          setSaveState('saved');
          setLastSaved(new Date());
        } catch {
          setSaveState('error');
        }
      }, 1000);
    },
    [onSaveRequest]
  );

  useEffect(() => {
    scheduleSave(doc);
  }, [doc, scheduleSave]);

  const selected = useMemo(
    () => doc.elements.find((e) => e.id === selectedId) || null,
    [doc.elements, selectedId]
  );

  // Drag logic.
  const { beginDrag } = useDrag({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    scale: zoom,
    docWidth: doc.width,
    getInitial: (id) => {
      const el = doc.elements.find((e) => e.id === id);
      return el ? { x: el.x, y: el.y } : { x: 0, y: 0 };
    },
    onStart: (id) => setSelectedId(id),
    onMove: (id, x, y) => {
      const el = doc.elements.find((e) => e.id === id);
      const res = snapElementPosition(id, x, y, el?.w || 20, typeof el?.h === 'number' ? el.h : 40, doc.elements, {
        snapGrid: showGrid,
      });
      setActiveGuides(res.guides);
      setDoc((d) => updateElement(d, id, { x: res.x, y: res.y } as Partial<CanvasElement>));
    },
    onEnd: (id, x, y) => {
      setActiveGuides([]);
      const el = doc.elements.find((e) => e.id === id);
      const res = snapElementPosition(id, x, y, el?.w || 20, typeof el?.h === 'number' ? el.h : 40, doc.elements, {
        snapGrid: showGrid,
      });
      setDoc((d) => {
        const next = updateElement(d, id, { x: res.x, y: res.y } as Partial<CanvasElement>);
        commit(next);
        return next;
      });
    },
  });

  // Resize logic.
  const { beginResize } = useResize({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    scale: zoom,
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

  const handleUpdateSelected = useCallback(
    (patch: Partial<CanvasElement>) => {
      if (!selectedId) return;
      const next = updateElement(doc, selectedId, patch);
      commit(next);
    },
    [doc, selectedId, commit]
  );

  const stageWidth = viewport === 'mobile' ? 390 : doc.width;
  const effectiveDoc = useMemo(() => {
    if (viewport === 'mobile') {
      return deriveMobileDocument(doc);
    }
    return { ...doc, width: stageWidth };
  }, [doc, stageWidth, viewport]);

  return (
    <div className="flex h-full flex-col bg-[#1b1419] text-zinc-100">
      <EditorToolbar
        viewport={viewport}
        onViewportChange={setViewport}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
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
        onPreviewGuest={() => {
          if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }}
        onPreviewAnimations={() => {
          setPreviewAnim(true);
          setTimeout(() => setPreviewAnim(false), 2500);
        }}
        onOpenPresets={() => setShowPresets(true)}
        saveState={saveState}
        lastSaved={lastSaved}
        onSaveNow={() => scheduleSave(doc)}
        locale={locale}
        mode={mode}
      />
      <div className="flex flex-1 min-h-0">
        <ElementPalette onAdd={handleAdd} locale={locale} />
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center" data-testid="canvas-stage-wrap">
          <div
            className={cn('relative shadow-2xl', showGrid && 'canvas-grid-bg')}
            style={{
              width: stageWidth * zoom,
              transform: `scale(1)`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={stageRef}
              style={{
                width: stageWidth,
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                marginBottom: (zoom - 1) * -200,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const type = e.dataTransfer.getData('text/plain') as CanvasElementType;
                if (!type) return;
                const rect = stageRef.current?.getBoundingClientRect();
                if (!rect) return;
                const xPx = (e.clientX - rect.left) / zoom;
                const yPx = (e.clientY - rect.top) / zoom;
                const stagePxPerPercent = (rect.width / zoom) / 100;
                const xPercent = Math.max(0, Math.min(80, xPx / stagePxPerPercent));
                handleAdd(type, xPercent, yPx);
              }}
            >
              <CanvasRenderer
                document={effectiveDoc}
                mode="editor"
                selectedId={selectedId}
                onSelect={setSelectedId}
                renderEditorShell={(el, children) => (
                  <SelectionChrome
                    el={el}
                    selected={el.id === selectedId}
                    zoom={zoom}
                    onDragStart={(e) => beginDrag(el.id, e)}
                    onResizeStart={(e, handle) => beginResize(el.id, handle, e)}
                    onRotateStart={(e) => beginRotate(el.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedId(el.id);
                      setContextMenu({ x: e.clientX, y: e.clientY, el });
                    }}
                  >
                    {children}
                  </SelectionChrome>
                )}
                forceAnimations={previewAnim}
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
        />
      </div>
      {contextMenu && (
        <ElementContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={contextMenu.el}
          locale={locale}
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
      {showPresets && (
        <PresetLibraryModal
          doc={doc}
          onApplyDoc={(nextDoc) => {
            commit(nextDoc);
          }}
          onClose={() => setShowPresets(false)}
          locale={locale}
        />
      )}
      <style>{`
        .canvas-grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
