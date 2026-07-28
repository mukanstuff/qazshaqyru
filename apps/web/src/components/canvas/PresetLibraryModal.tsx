'use client';

import { useState } from 'react';
import type { InvitationCanvasDocument, CanvasElement, FontFamily } from '@/lib/canvas/types';
import { Button } from '@/components/ui/button';

interface Props {
  doc: InvitationCanvasDocument;
  onApplyDoc: (nextDoc: InvitationCanvasDocument) => void;
  onClose: () => void;
  locale: 'ru' | 'kz';
}

const PALETTES = [
  { id: 'bordeaux', name: 'Бордо и золото', bg: '#fff8f1', primary: '#6b1d3a', accent: '#c9a961', text: '#2c1810' },
  { id: 'rose', name: 'Нежно-розовый', bg: '#fff5f7', primary: '#d88c9a', accent: '#c47b89', text: '#3d262b' },
  { id: 'mono', name: 'Классика ч/б', bg: '#ffffff', primary: '#18181b', accent: '#71717a', text: '#09090b' },
  { id: 'emerald', name: 'Изумруд и золото', bg: '#f4f9f5', primary: '#1b4332', accent: '#b8956b', text: '#192820' },
];

const FONT_PAIRS: Array<{ id: string; name: string; heading: FontFamily; body: FontFamily }> = [
  { id: 'cormorant-montserrat', name: 'Cormorant + Montserrat', heading: 'Cormorant', body: 'Montserrat' },
  { id: 'marck-montserrat', name: 'Marck Script + Montserrat', heading: 'Marck', body: 'Montserrat' },
  { id: 'unbounded-montserrat', name: 'Unbounded + Montserrat', heading: 'Unbounded', body: 'Montserrat' },
];

const BACKGROUNDS = [
  { id: 'ivory', name: 'Светлая слоновая кость', color: '#fff8f1' },
  { id: 'white', name: 'Чистый белый', color: '#ffffff' },
  { id: 'dark', name: 'Тёмный люкс', color: '#1b1419' },
  { id: 'rose-bg', name: 'Пастельно-розовый', color: '#fff0f3' },
];

export function PresetLibraryModal({ doc, onApplyDoc, onClose, locale }: Props) {
  const [tab, setTab] = useState<'palettes' | 'fonts' | 'backgrounds'>('palettes');

  const applyPalette = (p: (typeof PALETTES)[0]) => {
    const nextElements = doc.elements.map((el): CanvasElement => {
      if (el.type === 'text') return { ...el, color: p.text };
      if (el.type === 'heading') return { ...el, color: p.primary };
      if (el.type === 'couple-names') return { ...el, color: p.primary, connectorColor: p.accent };
      if (el.type === 'divider') return { ...el, color: p.accent };
      if (el.type === 'countdown') return { ...el, color: p.primary, accentColor: p.accent };
      return el;
    });
    onApplyDoc({
      ...doc,
      background: { type: 'solid', color: p.bg },
      elements: nextElements,
    });
    onClose();
  };

  const applyFontPair = (fp: (typeof FONT_PAIRS)[0]) => {
    const nextElements = doc.elements.map((el): CanvasElement => {
      if (el.type === 'heading') return { ...el, fontFamily: fp.heading };
      if (el.type === 'text') return { ...el, fontFamily: fp.body };
      if (el.type === 'couple-names') return { ...el, font: fp.heading };
      return el;
    });
    onApplyDoc({
      ...doc,
      elements: nextElements,
    });
    onClose();
  };

  const applyBg = (bg: (typeof BACKGROUNDS)[0]) => {
    onApplyDoc({
      ...doc,
      background: { type: 'solid', color: bg.color },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl text-zinc-100 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-display text-lg font-semibold">
            {locale === 'ru' ? 'Библиотека пресетов' : 'Пресеттер кітапханасы'}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setTab('palettes')}
            className={`px-3 py-1.5 rounded text-xs transition ${
              tab === 'palettes' ? 'bg-[#6b1d3a] text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Цветовые палитры
          </button>
          <button
            onClick={() => setTab('fonts')}
            className={`px-3 py-1.5 rounded text-xs transition ${
              tab === 'fonts' ? 'bg-[#6b1d3a] text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Шрифтовые пары
          </button>
          <button
            onClick={() => setTab('backgrounds')}
            className={`px-3 py-1.5 rounded text-xs transition ${
              tab === 'backgrounds' ? 'bg-[#6b1d3a] text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Фоны
          </button>
        </div>

        {tab === 'palettes' && (
          <div className="grid grid-cols-2 gap-3">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPalette(p)}
                className="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 text-left hover:border-[#c9a961]"
              >
                <div className="flex h-6 w-full rounded overflow-hidden border border-zinc-700">
                  <div style={{ backgroundColor: p.bg, flex: 1 }} />
                  <div style={{ backgroundColor: p.primary, flex: 1 }} />
                  <div style={{ backgroundColor: p.accent, flex: 1 }} />
                </div>
                <span className="text-xs font-semibold">{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'fonts' && (
          <div className="flex flex-col gap-2">
            {FONT_PAIRS.map((fp) => (
              <button
                key={fp.id}
                onClick={() => applyFontPair(fp)}
                className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 text-left hover:border-[#c9a961]"
              >
                <div>
                  <div className="text-sm font-semibold">{fp.name}</div>
                  <div className="text-xs text-zinc-400">
                    Заголовок: {fp.heading} · Текст: {fp.body}
                  </div>
                </div>
                <span className="text-xs text-[#c9a961]">Применить →</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'backgrounds' && (
          <div className="grid grid-cols-2 gap-3">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => applyBg(bg)}
                className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 text-left hover:border-[#c9a961]"
              >
                <div
                  style={{ backgroundColor: bg.color }}
                  className="h-8 w-8 rounded-full border border-zinc-600 shrink-0"
                />
                <span className="text-xs font-semibold">{bg.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}
