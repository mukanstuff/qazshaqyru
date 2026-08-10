'use client';

/**
 * Shared editor UI primitives.
 *
 * Provides reusable, themed components for the invitation editor workbench:
 * - Section, Field, TextInput, TextArea, Toggle, ToggleRow
 * - ColorPicker (swatch grid + custom hex input)
 * - AnimationGrid (enter / loop animations)
 * - MusicTrackRow
 * - GalleryGrid
 * - SlugInput
 *
 * All styles use the .editor-pane-* CSS classes (see globals.css).
 * Color/typography/font sizes are 100% themed via CSS — no inline color hacks.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/shared/utils';
import { X, ImagePlus, Upload, GripVertical, AlertTriangle, Check, Loader2 } from 'lucide-react';

// ─── Section header ──────────────────────────────────────────────────────────

export function PaneSection({
  title,
  hint,
  children,
  className,
  action,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn('editor-pane-section', className)}>
      <div className="editor-pane-section__header">
        <div className="flex items-center gap-2">
          <h3 className="editor-pane-section__title">{title}</h3>
          {hint ? <span className="editor-pane-section__hint">{hint}</span> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

export function PaneField({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('editor-pane-field', className)}>
      {label ? (
        <label className="editor-pane-field__label">
          <span>{label}</span>
          {hint ? <span className="editor-pane-field__label-hint">{hint}</span> : null}
        </label>
      ) : null}
      {children}
      {hint && label ? <p className="editor-pane-field__hint">{hint}</p> : null}
    </div>
  );
}

// ─── Text input ──────────────────────────────────────────────────────────────

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'time' | 'url' | 'tel' | 'email' | 'number';
  maxLength?: number;
  icon?: React.ReactNode;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'url' | 'email';
}

export function TextInput({ value, onChange, placeholder, type = 'text', maxLength, icon, autoComplete, inputMode }: TextInputProps) {
  const inputCls = cn('editor-pane-input', icon && 'editor-pane-input--with-icon');
  if (icon) {
    return (
      <div className="editor-pane-input-wrap">
        <span className="editor-pane-input-icon">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={inputCls}
        />
      </div>
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className={inputCls}
    />
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextAreaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export function TextArea({ value, onChange, placeholder, rows = 3, maxLength }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="editor-pane-textarea"
    />
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, hint, id }: ToggleProps) {
  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className="editor-pane-toggle"
    >
      <span className="editor-pane-toggle__thumb" />
    </button>
  );
  if (!label && !hint) return toggle;
  return (
    <div className="editor-pane-toggle-row">
      <div className="editor-pane-toggle-row__label">
        <div className="editor-pane-toggle-row__title">{label}</div>
        {hint ? <div className="editor-pane-toggle-row__hint">{hint}</div> : null}
      </div>
      {toggle}
    </div>
  );
}

// ─── Pills (segment / chip) ──────────────────────────────────────────────────

interface PillsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}

export function Pills<T extends string>({ options, value, onChange, ariaLabel }: PillsProps<T>) {
  return (
    <div className="editor-pane-pills" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="editor-pane-pill"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Color picker ────────────────────────────────────────────────────────────

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets: string[];
  placeholder?: string;
}

export function ColorPicker({ value, onChange, presets, placeholder = '#e9e4dc' }: ColorPickerProps) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value); }, [value]);
  const isValid = /^#[0-9a-fA-F]{6}$/.test(draft);

  return (
    <div className="space-y-2">
      <div className="editor-pane-color-row">
        <div
          className="editor-pane-color-input__swatch"
          style={{ background: isValid ? draft : '#1a1a1c' }}
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (isValid) onChange(draft);
            else setDraft(value);
          }}
          placeholder={placeholder}
          maxLength={7}
          className="editor-pane-color-input__hex"
          aria-label="Hex color"
        />
        <input
          type="color"
          value={isValid ? draft : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="editor-pane-color"
          style={{ width: 32, height: 32 }}
          aria-label="Pick color"
          tabIndex={-1}
        />
      </div>
      <div className="editor-pane-color-grid">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            aria-pressed={value === color}
            aria-label={color}
            onClick={() => onChange(color)}
            className="editor-pane-color"
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Slider (range input) ────────────────────────────────────────────────────

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  leftLabel?: string;
  rightLabel?: string;
}

export function Slider({ value, onChange, min, max, step = 0.5, formatValue, leftLabel, rightLabel }: SliderProps) {
  return (
    <div className="editor-pane-slider-row">
      {leftLabel ? <span className="editor-pane-slider-row__label">{leftLabel}</span> : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="editor-pane-slider"
        aria-label={leftLabel && rightLabel ? `${leftLabel} – ${rightLabel}` : undefined}
      />
      {rightLabel ? <span className="editor-pane-slider-row__label editor-pane-slider-row__label--right">{rightLabel}</span> : null}
      {formatValue ? <span className="editor-pane-slider-row__value">{formatValue(value)}</span> : null}
    </div>
  );
}

// ─── Slug input (with availability check) ────────────────────────────────────

interface SlugInputProps {
  value: string;
  onChange: (v: string) => void;
  onSave?: (v: string) => void;
  origin: string;
  check: (slug: string) => Promise<{ available: boolean; error?: string }>;
  initialSlug?: string;
  placeholder?: string;
}

export function SlugInput({ value, onChange, onSave, origin, check, initialSlug, placeholder }: SlugInputProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync
  useEffect(() => {
    if (!value) { setStatus('idle'); setError(null); return; }
    if (value === initialSlug) { setStatus('ok'); setError(null); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      setStatus('error');
      setError('Только латиница (a-z), цифры и дефис');
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await check(value);
        if (result.available) {
          setStatus('ok');
          setError(null);
        } else {
          setStatus('error');
          setError(result.error ?? 'Этот адрес уже занят');
        }
      } catch {
        setStatus('error');
        setError('Не удалось проверить');
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, initialSlug, check]);

  const handleBlur = useCallback(() => {
    if (status === 'ok' && onSave) onSave(value);
  }, [status, onSave, value]);

  return (
    <div className="space-y-2">
      <div className="editor-pane-link">
        <span className="editor-pane-link__prefix">{origin}/i/</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          onBlur={handleBlur}
          placeholder={placeholder ?? 'aida-daniyar'}
          maxLength={80}
          className="editor-pane-link__input"
          aria-invalid={status === 'error'}
        />
        <span
          className={cn(
            'editor-pane-link__indicator',
            status === 'ok' && 'editor-pane-link__indicator--ok'
          )}
        >
          {status === 'checking' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
            status === 'ok' ? <Check className="h-3.5 w-3.5" /> :
            status === 'error' ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
        </span>
      </div>
      {error ? (
        <p className="editor-pane-error">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── Image upload zone ───────────────────────────────────────────────────────

interface UploadZoneProps {
  onUpload: (file: File) => void | Promise<void>;
  uploading?: boolean;
  accept?: string;
  label?: string;
  multiple?: boolean;
}

export function UploadZone({ onUpload, uploading, accept = 'image/*', label = 'Загрузить файл', multiple }: UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="editor-pane-upload"
      >
        <Upload className="h-4 w-4" />
        <span>{uploading ? 'Загрузка…' : label}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          for (const file of files) {
            await onUpload(file);
          }
          if (ref.current) ref.current.value = '';
        }}
      />
    </>
  );
}

// ─── Gallery grid ────────────────────────────────────────────────────────────

interface GalleryProps {
  urls: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  max?: number;
}

export function GalleryGrid({ urls, onAdd, onRemove, max = 8 }: GalleryProps) {
  return (
    <div className="editor-pane-gallery">
      {urls.map((url, i) => (
        <div key={`${url}-${i}`} className="editor-pane-gallery__cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Фото ${i + 1}`} />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="editor-pane-gallery__cell-remove"
            aria-label={`Удалить фото ${i + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
          <div className="editor-pane-gallery__cell-index">
            <GripVertical className="h-2.5 w-2.5" />
            {i + 1}
          </div>
        </div>
      ))}
      {urls.length < max ? (
        <button
          type="button"
          onClick={() => document.getElementById('gallery-upload-trigger')?.click()}
          className="editor-pane-gallery__add"
        >
          <ImagePlus className="h-5 w-5" />
          <span>Добавить</span>
        </button>
      ) : null}
    </div>
  );
}