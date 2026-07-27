'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasElement, CanvasElementType, InvitationCanvasDocument } from '@/lib/canvas/types';
import { CanvasRenderer } from './CanvasRenderer';
import { HistoryStack, addElement, deleteElement, duplicateElement, moveElement, updateElement } from '@/lib/canvas/mutations';
import { InspectorPanel } from './InspectorPanel';
import { ElementPalette } from './ElementPalette';
import { EditorToolbar } from './EditorToolbar';
import { SelectionChrome } from './SelectionChrome';
import { useDrag } from './hooks/useDrag';
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

  // Autosave with 1s debounce.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setDoc((d) => updateElement(d, id, { x, y } as Partial<CanvasElement>));
    },
    onEnd: (id, x, y) => {
      setDoc((d) => {
        const next = updateElement(d, id, { x, y } as Partial<CanvasElement>);
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
    (type: CanvasElementType) => {
      const next = addElement(doc, type);
      const newId = next.elements[next.elements.length - 1].id;
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
  const effectiveDoc = useMemo(() => ({ ...doc, width: stageWidth }), [doc, stageWidth]);

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
                  >
                    {children}
                  </SelectionChrome>
                )}
                forceAnimations={previewAnim}
                shareUrl={shareUrl}
                locale={locale}
              />
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
