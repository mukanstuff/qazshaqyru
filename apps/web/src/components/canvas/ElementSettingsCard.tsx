'use client';

import { useEffect, useRef } from 'react';
import type { CanvasElement } from '@/lib/canvas/types';
import { settingsFieldsFor, settingsTitleFor, type SettingsField } from './ElementSettingsConfig';
import { SwatchColorPicker } from './SwatchColorPicker';

/**
 * 2026-08-17 (pilot-2): floating settings card for the selected element.
 *
 * Position: horizontally centered, sits in the lower half of the viewport
 * above the bottom sections island. NOT a fullscreen modal. NOT a
 * sidebar. Auto-height up to a cap (60dvh). Backdrop is dismissable.
 *
 * Replaces ElementBottomSheet from the previous pilot. Same field config
 * — just a different visual frame.
 */
interface Props {
  el: CanvasElement;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ElementSettingsCard({ el, onUpdate, onDelete, onClose }: Props) {
  const fields = settingsFieldsFor(el.type);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Swipe-down to dismiss.
  const dragStartY = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragDelta.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    dragDelta.current = Math.max(0, e.clientY - dragStartY.current);
    if (cardRef.current) cardRef.current.style.transform = `translateY(${dragDelta.current}px)`;
  };
  const onPointerUp = () => {
    if (dragDelta.current > 80) onClose();
    else if (cardRef.current) cardRef.current.style.transform = '';
    dragStartY.current = null;
    dragDelta.current = 0;
  };

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="editor-settings-backdrop"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={settingsTitleFor(el.type)}
        className="editor-settings-card"
      >
        <div
          className="editor-settings-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <span className="editor-settings-handle-bar" />
        </div>

        <div className="editor-settings-header">
          <p className="editor-settings-title">{settingsTitleFor(el.type)}</p>
          <button
            type="button"
            className="editor-settings-close"
            onClick={onClose}
            aria-label="Закрыть"
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="editor-settings-body">
          {fields.length === 0 ? (
            <div className="editor-settings-empty">
              Настройки этого элемента пока не настраиваются через редактор.
            </div>
          ) : (
            fields.map((f) => (
              <FieldRow
                key={`${f.kind}-${f.key}`}
                field={f}
                el={el}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>

        <div className="editor-settings-footer">
          <button
            type="button"
            className="editor-settings-delete"
            onClick={onDelete}
          >
            🗑 Удалить
          </button>
        </div>
      </div>
    </>
  );
}

function FieldRow({
  field,
  el,
  onUpdate,
}: {
  field: SettingsField;
  el: CanvasElement;
  onUpdate: (patch: Partial<CanvasElement>) => void;
}) {
  const value = (el as unknown as Record<string, unknown>)[field.key];
  const update = (v: unknown) => onUpdate({ [field.key]: v } as Partial<CanvasElement>);

  return (
    <div className="editor-settings-field">
      <span className="editor-settings-label">{field.label}</span>
      <FieldControl field={field} value={value} update={update} />
    </div>
  );
}

function FieldControl({
  field,
  value,
  update,
}: {
  field: SettingsField;
  value: unknown;
  update: (v: unknown) => void;
}) {
  switch (field.kind) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => update(e.target.value || undefined)}
          className="canvas-inspector-input is-block"
        />
      );
    case 'longtext':
      return (
        <textarea
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => update(e.target.value)}
          rows={3}
          className="canvas-inspector-textarea is-block"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? 0}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => update(Number(e.target.value))}
          className="canvas-inspector-input is-block"
        />
      );
    case 'range':
      return (
        <div className="editor-settings-range">
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={(value as number) ?? field.min}
            onChange={(e) => update(Number(e.target.value))}
            className="ci-range"
          />
          <span className="editor-settings-range-value">
            {typeof value === 'number' ? value : field.min}
          </span>
        </div>
      );
    case 'color':
      return (
        <SwatchColorPicker
          value={(value as string) ?? '#000000'}
          onChange={(c) => update(c)}
        />
      );
    case 'select':
      return (
        <select
          value={(value as string) ?? field.options[0]?.value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            update(isNaN(Number(raw)) ? raw : Number(raw));
          }}
          className="canvas-inspector-input canvas-inspector-select is-block"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => update(e.target.checked)}
          />
          <span className="ci-checkbox-label">{field.label}</span>
        </label>
      );
    default:
      return null;
  }
}
