'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  /** Accent color for the picker button background */
  swatchColor?: string;
  className?: string;
}

const PRESET_COLORS = [
  '#6b1d3a', '#c9a961', '#ffffff', '#000000',
  '#e8d5b7', '#2d5016', '#8b1a1a', '#1a3a5c',
  '#f5f0eb', '#4a3728', '#6b5b4f', '#c4a882',
];

export function SwatchColorPicker({ value, onChange, label, className = '' }: Props) {
  const [showPresets, setShowPresets] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setHexInput(e.target.value);
  };

  // Open the popover and compute its position once via getBoundingClientRect.
  // Using fixed positioning in document.body (via createPortal) so it isn't
  // clipped by the scroll container.
  const openPopover = () => {
    if (!triggerRef.current) {
      setShowPresets(true);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    // Position below the swatch, aligned with its left edge.
    setPopoverPos({ top: rect.bottom + 6, left: rect.left });
    setShowPresets(true);
  };

  const closePopover = () => setShowPresets(false);

  // Close when clicking outside the popover or trigger button.
  useEffect(() => {
    if (!showPresets) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      closePopover();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showPresets]);

  // Close on Esc.
  useEffect(() => {
    if (!showPresets) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopover();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showPresets]);

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {label && (
        <span style={{ color: 'var(--ed-text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</span>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => (showPresets ? closePopover() : openPopover())}
        title={value}
        style={{
          position: 'relative',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: '1px solid var(--ed-border-strong)',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: value,
          flexShrink: 0,
          padding: 0,
        }}
      >
        <input
          type="color"
          value={value}
          onChange={handleNativeChange}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </button>

      <input
        type="text"
        value={hexInput}
        onChange={(e) => handleHexChange(e.target.value)}
        onBlur={() => {
          if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
            onChange(hexInput);
          } else {
            setHexInput(value);
          }
        }}
        maxLength={7}
        style={{
          width: '72px',
          background: 'var(--ed-surface-2)',
          border: '1px solid var(--ed-border)',
          borderRadius: 'var(--ed-radius-sm)',
          padding: '6px 8px',
          fontSize: '11px',
          color: 'var(--ed-text)',
          outline: 'none',
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      />

      {showPresets &&
        popoverPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="canvas-popover"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="cpp-swatch-grid">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`cpp-swatch ${c.toLowerCase() === value.toLowerCase() ? 'is-active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    onChange(c);
                    setHexInput(c);
                    setShowPresets(false);
                  }}
                  title={c}
                />
              ))}
            </div>

            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              onBlur={() => {
                if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
                  onChange(hexInput);
                } else {
                  setHexInput(value);
                }
              }}
              placeholder="#000000"
              maxLength={7}
              className="cpp-hex-input"
              style={{ marginBottom: '8px' }}
            />

            <label
              className="cpp-native-color"
              style={{ display: 'block', position: 'relative' }}
              title="Пипетка"
            >
              <input type="color" value={value} onChange={handleNativeChange} />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  pointerEvents: 'none',
                  color: 'rgba(0,0,0,0.45)',
                }}
              >
                🖋
              </span>
            </label>
          </div>,
          document.body
        )}
    </div>
  );
}
