'use client';

import { useState } from 'react';

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

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="text-zinc-300 text-xs whitespace-nowrap">{label}</span>
      )}
      {/* Swatch preview */}
      <button
        type="button"
        className="w-7 h-7 rounded border border-zinc-600 overflow-hidden shrink-0 hover:border-[#c9a961] transition-colors relative"
        style={{ backgroundColor: value }}
        title={value}
        onClick={() => setShowPresets((s) => !s)}
      >
        <input
          type="color"
          value={value}
          onChange={handleNativeChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </button>
      {/* Hex input */}
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
        className="w-[72px] bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-100 focus:outline-none focus:border-[#c9a961] uppercase font-mono"
        maxLength={7}
      />
      {/* Preset dropdown */}
      {showPresets && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl">
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-6 h-6 rounded border border-zinc-600 hover:border-[#c9a961] transition-colors"
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
          <div
            className="w-full h-6 rounded border border-zinc-700 overflow-hidden cursor-pointer relative"
            title="Пипетка"
          >
            <input
              type="color"
              value={value}
              onChange={handleNativeChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center text-[9px] text-white font-bold drop-shadow"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              🖋
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
