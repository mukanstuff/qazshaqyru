'use client';

import { useRef, useState } from 'react';
import { useDrag } from '@/components/canvas/hooks/useDrag';
import { useResize } from '@/components/canvas/hooks/useResize';
import { useRotate } from '@/components/canvas/hooks/useRotate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toaster';
import type { EditorGuestInfo } from './types';

export interface VisualSeatingTable {
  id: string;
  name: string;
  capacity: number;
  assignedCount: number;
  guestIds: string[];
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
  rotation?: number | null;
  shape?: string | null;
  tableColor?: string | null;
}

interface Props {
  invitationId: string;
  tables: VisualSeatingTable[];
  guests: EditorGuestInfo[];
  onUpdateTable: (tableId: string, patch: Partial<VisualSeatingTable>) => Promise<void>;
  onCreateTable: (name: string, capacity: number, shape: string) => Promise<void>;
  onAssignGuest: (guestId: string, tableId: string | null) => Promise<void>;
  onDeleteTable: (tableId: string) => Promise<void>;
}

export function VisualSeatingChart({
  invitationId,
  tables,
  guests,
  onUpdateTable,
  onCreateTable,
  onAssignGuest,
  onDeleteTable,
}: Props) {
  const { toast } = useToast();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'all' | 'bride' | 'groom'>('all');
  const [sharing, setSharing] = useState(false);

  // Unseated guests filter
  const unseated = guests.filter((g) => {
    if (!g.id || tables.some((t) => t.guestIds.includes(g.id!))) return false;
    if (sideFilter !== 'all' && g.side !== sideFilter) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedTable = tables.find((t) => t.id === selectedId) || null;

  // Hooks for moving tables
  const { beginDrag } = useDrag({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    scale: 1,
    docWidth: 800,
    getInitial: (id) => {
      const t = tables.find((x) => x.id === id);
      return t ? { x: t.x ?? 10, y: t.y ?? 100 } : { x: 0, y: 0 };
    },
    onStart: (id) => setSelectedId(id),
    onMove: (id, x, y) => {
      onUpdateTable(id, { x, y });
    },
    onEnd: (id, x, y) => {
      onUpdateTable(id, { x, y });
    },
  });

  const { beginResize } = useResize({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    scale: 1,
    docWidth: 800,
    getInitial: (id) => {
      const t = tables.find((x) => x.id === id);
      return t ? { x: t.x ?? 10, y: t.y ?? 100, w: t.w ?? 15, h: t.h ?? 120 } : { x: 10, y: 100, w: 15, h: 120 };
    },
    onResize: (id, x, y, w, h) => {
      onUpdateTable(id, { x, y, w, h: typeof h === 'number' ? h : 120 });
    },
    onEnd: (id, x, y, w, h) => {
      onUpdateTable(id, { x, y, w, h: typeof h === 'number' ? h : 120 });
    },
  });

  const { beginRotate } = useRotate({
    stageRef: stageRef as React.RefObject<HTMLElement>,
    getInitial: (id) => {
      const t = tables.find((x) => x.id === id);
      return t ? { rotation: t.rotation ?? 0 } : { rotation: 0 };
    },
    onRotate: (id, deg) => {
      onUpdateTable(id, { rotation: deg });
    },
    onEnd: (id, deg) => {
      onUpdateTable(id, { rotation: deg });
    },
  });

  const handleShareRestaurant = async () => {
    setSharing(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/restaurant-share`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка');
      const shareUrl = `${window.location.origin}/r/${data.token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Ссылка скопирована',
        description: 'Отправьте эту ссылку тойхане или администратору зала.',
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось создать ссылку',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row min-h-[550px]">
      {/* Left toolbox */}
      <aside className="w-full lg:w-48 shrink-0 flex flex-col gap-2 rounded-xl border border-us-border bg-us-surface p-3 text-xs">
        <div className="font-display font-semibold text-us-ink mb-1">Инструменты</div>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => void onCreateTable(`Стол ${tables.length + 1}`, 10, 'round')}
        >
          <span>⚪</span> Круглый стол
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => void onCreateTable(`Стол ${tables.length + 1}`, 12, 'rect')}
        >
          <span>▭</span> Прямоугольный
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => void onCreateTable('Президиум', 6, 'presidium')}
        >
          <span>👑</span> Президиум
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => void onCreateTable('Сцена', 0, 'stage')}
        >
          <span>🎤</span> Сцена / Зона
        </Button>

        <div className="border-t border-us-border my-2 pt-2 flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleShareRestaurant}
            disabled={sharing}
            className="w-full text-xs"
          >
            {sharing ? 'Создание...' : 'Поделиться с рестораном'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="w-full text-xs"
          >
            Скачать PDF / Печать
          </Button>
        </div>
      </aside>

      {/* Middle visual stage */}
      <div
        ref={stageRef}
        className="flex-1 relative overflow-hidden rounded-xl border border-us-border bg-[#f8f5f1] min-h-[500px]"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
        data-testid="seating-canvas"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#6b1d3a 1px, transparent 1px), linear-gradient(90deg, #6b1d3a 1px, transparent 1px)',
            backgroundSize: '25px 25px',
          }}
        />

        {tables.map((t) => {
          const isSelected = t.id === selectedId;
          const left = `${t.x ?? 20}%`;
          const top = `${t.y ?? 100}px`;
          const width = `${t.w ?? 20}%`;
          const height = `${t.h ?? 120}px`;
          const rotation = `rotate(${t.rotation ?? 0}deg)`;

          return (
            <div
              key={t.id}
              data-selected-id={t.id}
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                transform: rotation,
                transformOrigin: 'center center',
                cursor: 'move',
                zIndex: isSelected ? 10 : 1,
              }}
              className={`flex flex-col items-center justify-center rounded-xl border-2 transition shadow-md ${
                isSelected
                  ? 'border-us-cta bg-white ring-2 ring-us-cta/30'
                  : 'border-us-accent/40 bg-white/95 hover:border-us-accent'
              }`}
              onPointerDown={(e) => beginDrag(t.id, e)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const guestId = e.dataTransfer.getData('text/plain');
                if (guestId) void onAssignGuest(guestId, t.id);
              }}
            >
              <div className="font-display text-xs font-bold text-us-ink text-center px-1 truncate">
                {t.name}
              </div>
              {t.capacity > 0 && (
                <div className="text-[10px] text-us-ink-muted">
                  {t.assignedCount} / {t.capacity}
                </div>
              )}

              {/* Handlers when selected */}
              {isSelected && (
                <>
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-us-gold border border-us-cta cursor-grab z-20"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      beginRotate(t.id, e);
                    }}
                    title="Повернуть"
                  />
                  <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-us-cta rounded cursor-se-resize z-20"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      beginResize(t.id, 'se', e);
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Right sidebar: Unseated Guests list (DnD source) + Table Inspector */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4 rounded-xl border border-us-border bg-us-surface p-3">
        {selectedTable && (
          <div className="flex flex-col gap-2 border-b border-us-border pb-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-us-ink">
                {selectedTable.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-us-danger hover:bg-us-danger/10 h-7 px-2"
                onClick={() => void onDeleteTable(selectedTable.id)}
              >
                Удалить
              </Button>
            </div>
            <div className="text-xs text-us-ink-muted">
              Гостей: {selectedTable.assignedCount} из {selectedTable.capacity}
            </div>
            {/* List of guests at this table */}
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedTable.guestIds.map((gid) => {
                const g = guests.find((x) => x.id === gid);
                if (!g) return null;
                return (
                  <div
                    key={gid}
                    className="flex items-center justify-between text-xs bg-us-ivory p-1.5 rounded"
                  >
                    <span className="truncate">{g.name}</span>
                    <button
                      type="button"
                      onClick={() => void onAssignGuest(gid, null)}
                      className="text-us-danger text-[10px] hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Guest Search and filter */}
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <div className="font-display text-sm font-semibold text-us-ink">
            Нерассаженные гости ({unseated.length})
          </div>
          <Input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-1 text-[11px]">
            {(['all', 'bride', 'groom'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setSideFilter(side)}
                className={`flex-1 py-1 rounded border transition ${
                  sideFilter === side
                    ? 'border-us-cta bg-us-cta/10 font-semibold text-us-cta'
                    : 'border-us-border text-us-ink-muted hover:bg-us-ivory'
                }`}
              >
                {side === 'all' ? 'Все' : side === 'bride' ? 'Невеста' : 'Жених'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-72">
            {unseated.map((g) => (
              <div
                key={g.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', g.id || '');
                }}
                className="flex items-center justify-between rounded border border-us-border bg-white p-2 text-xs shadow-sm cursor-grab active:cursor-grabbing hover:border-us-cta/50"
              >
                <div className="truncate font-medium text-us-ink">{g.name}</div>
                <div className="text-[10px] text-us-ink-muted">
                  {g.side === 'bride' ? 'Нев.' : g.side === 'groom' ? 'Жен.' : ''}
                </div>
              </div>
            ))}
            {unseated.length === 0 && (
              <div className="text-center text-xs text-us-ink-muted py-4">
                Все гости рассажены ✓
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
