'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Circle,
  Plus,
  RectangleHorizontal,
  RotateCw,
  Trash2,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import type { SeatingTableDto } from '@/lib/guests/seating';
import {
  DEFAULT_TABLE,
  HALL_OBJECT_SHAPES,
  HALL_OBJECT_SIZE,
  isHallObject,
  nextFreeTableSlot,
  TABLE_MAX_CAPACITY,
  TABLE_MIN_CAPACITY,
  type HallObjectShape,
  type SeatableShape,
} from '@/lib/guests/seating-layout';
import { SeatingHall } from '@/components/seating/SeatingHall';
import { useSeatingPlan, seatsForGuest, type PlannerGuest } from '@/components/seating/useSeatingPlan';
import '@/styles/seating-planner.css';

const TABLE_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#fb923c', '#9d8ec4', '#64748b'];

interface Props {
  invitationId: string;
  guestsHref: string;
  initialTables: SeatingTableDto[];
  guests: PlannerGuest[];
}

export function SeatingPlanner({ invitationId, guestsHref, initialTables, guests }: Props) {
  const { t } = useI18n();
  const plan = useSeatingPlan({ invitationId, initialTables, guests });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seatsLabel = useCallback(
    (table: SeatingTableDto) =>
      t('seating.planner.seatsOf', { taken: table.seatsTaken, capacity: table.capacity }),
    [t]
  );

  const addTable = useCallback(
    (shape: SeatableShape) => {
      const w = shape === 'rect' ? 260 : DEFAULT_TABLE.w;
      const h = DEFAULT_TABLE.h;
      const { x, y } = nextFreeTableSlot(plan.tables, w, h);
      void plan.addTable({
        name: t('seating.planner.tableDefaultName', { n: plan.tables.length + 1 }),
        shape,
        capacity: DEFAULT_TABLE.capacity,
        w,
        h,
        x,
        y,
      });
    },
    [plan, t]
  );

  /*
   * Fixtures are added through the same call as tables — same row, same drag,
   * same persistence — with capacity left unset, which the server reads as
   * zero for anything that is not a table.
   *
   * The name has to be unique per invitation (a DB constraint), so a second
   * bar becomes "Бар 2" rather than failing with a duplicate error.
   */
  const addObject = useCallback(
    (shape: HallObjectShape) => {
      const { w, h } = HALL_OBJECT_SIZE[shape];
      const { x, y } = nextFreeTableSlot(plan.tables, w, h);
      const base = t(`seating.planner.object.${shape}`);
      const taken = new Set(plan.tables.map((tbl) => tbl.name));
      let name = base;
      for (let n = 2; taken.has(name); n += 1) name = `${base} ${n}`;
      void plan.addTable({ name, shape, w, h, x, y });
    },
    [plan, t]
  );

  const seatGuest = useCallback(
    async (guestId: string) => {
      if (!plan.selectedTable) return;
      const message = await plan.assignGuest(guestId, plan.selectedTable.id);
      if (message) setError(message);
      else {
        setError(null);
        setPickerOpen(false);
      }
    },
    [plan]
  );

  const selectedGuests = useMemo(() => {
    if (!plan.selectedTable) return [];
    return plan.selectedTable.guestIds
      .map((id) => plan.guestById.get(id))
      .filter((g): g is PlannerGuest => Boolean(g));
  }, [plan.guestById, plan.selectedTable]);

  // Seating is built from the guest list; without guests the hall is a toy.
  if (guests.length === 0) {
    return (
      <div className="seating-shell">
        <div className="seating-empty">
          <h2 className="seating-empty-title">{t('seating.planner.noGuestsTitle')}</h2>
          <p className="seating-empty-desc">{t('seating.planner.noGuestsDesc')}</p>
          <Link href={guestsHref} className="seating-btn seating-btn--primary">
            {t('seating.planner.goToGuests')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="seating-shell">
      <div className="seating-toolbar">
        <div className="seating-toolbar-actions">
          <button type="button" className="seating-btn" onClick={() => addTable('round')} disabled={plan.busy}>
            <Circle size={15} aria-hidden />
            {t('seating.planner.addRound')}
          </button>
          <button type="button" className="seating-btn" onClick={() => addTable('rect')} disabled={plan.busy}>
            <RectangleHorizontal size={15} aria-hidden />
            {t('seating.planner.addRect')}
          </button>
        </div>
        {/*
          Fixtures of the room. Separated from the table buttons because they
          answer a different question: not "where does this guest sit" but
          "where in the hall is that".
        */}
        <div className="seating-toolbar-actions seating-toolbar-actions--objects">
          <span className="seating-toolbar-label">{t('seating.planner.objectsLabel')}</span>
          {HALL_OBJECT_SHAPES.map((shape) => (
            <button
              key={shape}
              type="button"
              className="seating-btn seating-btn--ghost"
              onClick={() => addObject(shape)}
              disabled={plan.busy}
            >
              {t(`seating.planner.object.${shape}`)}
            </button>
          ))}
        </div>
        <div className="seating-toolbar-status">
          {plan.saveState === 'saving' ? <span>{t('seating.planner.saving')}</span> : null}
          {plan.saveState === 'saved' ? <span className="is-ok">{t('seating.planner.saved')}</span> : null}
          {plan.saveState === 'error' ? (
            <span className="is-err">{t('seating.planner.saveError')}</span>
          ) : null}
        </div>
      </div>

      <p className="seating-summary">
        {t('seating.planner.summary', {
          tables: plan.totals.tables,
          seated: plan.totals.seatedSeats,
          total: plan.totals.totalSeats,
        })}
      </p>

      {plan.tables.length === 0 ? (
        <div className="seating-empty seating-empty--inline">
          <h2 className="seating-empty-title">{t('seating.planner.emptyTitle')}</h2>
          <p className="seating-empty-desc">{t('seating.planner.emptyDesc')}</p>
        </div>
      ) : (
        <>
          <SeatingHall
            tables={plan.tables}
            selectedTableId={plan.selectedTableId}
            onSelect={plan.setSelectedTableId}
            onMoveLocal={plan.moveTableLocal}
            onMoveCommit={plan.commitTableMove}
            seatsLabel={seatsLabel}
          />
          <p className="seating-hint">
            {plan.selectedTable ? t('seating.planner.hallHint') : t('seating.planner.selectTableHint')}
          </p>
        </>
      )}

      {/* Unassigned guests — the working pile the owner is trying to empty. */}
      <section className="seating-panel">
        <h2 className="seating-panel-title">
          {t('seating.planner.unassignedCount', { count: plan.unassignedGuests.length })}
        </h2>
        {plan.unassignedGuests.length === 0 ? (
          <p className="seating-panel-empty">{t('seating.planner.unassignedEmpty')}</p>
        ) : (
          <ul className="seating-chip-list">
            {plan.unassignedGuests.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className="seating-chip"
                  disabled={!plan.selectedTable || plan.busy}
                  onClick={() => void seatGuest(g.id)}
                  title={
                    plan.selectedTable
                      ? t('seating.planner.addGuest')
                      : t('seating.planner.selectTableHint')
                  }
                >
                  <span className="seating-chip-name">{g.name}</span>
                  {seatsForGuest(g) > 1 ? (
                    <span className="seating-chip-badge">×{seatsForGuest(g)}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Selected-table inspector */}
      {plan.selectedTable ? (
        <section className="seating-inspector">
          <div className="seating-inspector-head">
            <input
              className="seating-input seating-input--title"
              value={plan.selectedTable.name}
              maxLength={80}
              aria-label={t('seating.planner.tableName')}
              onChange={(e) =>
                void plan.updateTable(plan.selectedTable!.id, { name: e.target.value })
              }
            />
            <button
              type="button"
              className="seating-icon-btn"
              onClick={() => plan.setSelectedTableId(null)}
              aria-label={t('seating.planner.close')}
            >
              <X size={16} />
            </button>
          </div>

          {isHallObject(plan.selectedTable.shape) ? null : (
          <div className="seating-field-row">
            <label className="seating-field">
              <span className="seating-field-label">{t('seating.planner.capacity')}</span>
              <input
                type="number"
                className="seating-input"
                min={TABLE_MIN_CAPACITY}
                max={TABLE_MAX_CAPACITY}
                value={plan.selectedTable.capacity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  void plan.updateTable(plan.selectedTable!.id, {
                    capacity: Math.min(TABLE_MAX_CAPACITY, Math.max(TABLE_MIN_CAPACITY, v)),
                  });
                }}
              />
            </label>

            <div className="seating-field">
              <span className="seating-field-label">{t('seating.planner.shape')}</span>
              <div className="seating-segmented">
                <button
                  type="button"
                  className={plan.selectedTable.shape === 'round' ? 'is-active' : ''}
                  onClick={() => void plan.updateTable(plan.selectedTable!.id, { shape: 'round' })}
                >
                  {t('seating.planner.shapeRound')}
                </button>
                <button
                  type="button"
                  className={plan.selectedTable.shape === 'rect' ? 'is-active' : ''}
                  onClick={() => void plan.updateTable(plan.selectedTable!.id, { shape: 'rect' })}
                >
                  {t('seating.planner.shapeRect')}
                </button>
              </div>
            </div>
          </div>
          )}

          {isHallObject(plan.selectedTable.shape) ? null : (
          <div className="seating-field">
            <span className="seating-field-label">{t('seating.planner.color')}</span>
            <div className="seating-swatches">
              {TABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`seating-swatch${plan.selectedTable!.tableColor === c ? ' is-active' : ''}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                  onClick={() => void plan.updateTable(plan.selectedTable!.id, { tableColor: c })}
                />
              ))}
            </div>
          </div>
          )}

          <div className="seating-inspector-actions">
            <button
              type="button"
              className="seating-btn"
              onClick={() =>
                void plan.updateTable(plan.selectedTable!.id, {
                  rotation: (plan.selectedTable!.rotation + 15) % 360,
                })
              }
            >
              <RotateCw size={15} aria-hidden />
              {t('seating.planner.rotate')}
            </button>
            <button
              type="button"
              className="seating-btn seating-btn--danger"
              disabled={plan.busy}
              onClick={() => {
                const table = plan.selectedTable!;
                if (!window.confirm(t('seating.planner.deleteTableConfirm', { name: table.name }))) return;
                void plan.deleteTable(table.id);
              }}
            >
              <Trash2 size={15} aria-hidden />
              {t('seating.planner.deleteTable')}
            </button>
          </div>

          {isHallObject(plan.selectedTable.shape) ? null : (
          <div className="seating-seated">
            <h3 className="seating-field-label">{t('seating.planner.seatedGuests')}</h3>
            {selectedGuests.length === 0 ? (
              <p className="seating-panel-empty">{t('seating.planner.unassignedEmpty')}</p>
            ) : (
              <ul className="seating-chip-list">
                {selectedGuests.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="seating-chip seating-chip--seated"
                      disabled={plan.busy}
                      onClick={() => void plan.assignGuest(g.id, null)}
                      title={t('seating.planner.removeFromTable')}
                    >
                      <span className="seating-chip-name">{g.name}</span>
                      {seatsForGuest(g) > 1 ? (
                        <span className="seating-chip-badge">×{seatsForGuest(g)}</span>
                      ) : null}
                      <X size={13} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="seating-btn seating-btn--primary"
              disabled={plan.unassignedGuests.length === 0 || plan.busy}
              onClick={() => setPickerOpen((v) => !v)}
            >
              <UserRoundPlus size={15} aria-hidden />
              {plan.unassignedGuests.length === 0
                ? t('seating.planner.addGuestEmpty')
                : t('seating.planner.addGuest')}
            </button>

            {pickerOpen && plan.unassignedGuests.length > 0 ? (
              <ul className="seating-chip-list seating-chip-list--picker">
                {plan.unassignedGuests.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="seating-chip"
                      disabled={plan.busy}
                      onClick={() => void seatGuest(g.id)}
                    >
                      <Plus size={13} aria-hidden />
                      <span className="seating-chip-name">{g.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          )}

          {error ? <p className="seating-error">{error}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
