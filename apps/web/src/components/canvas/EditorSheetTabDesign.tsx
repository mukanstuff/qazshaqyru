'use client';

import { useCallback } from 'react';
import { useI18n } from '@/i18n';
import type { InvitationCanvasDocument, CanvasElement, FontFamily } from '@/lib/canvas/types';
import { SwatchColorPicker } from './SwatchColorPicker';

interface Props {
  document: InvitationCanvasDocument;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

// ─── Preset data ──────────────────────────────────────────────────────────────

const PALETTES: Array<{
  id: string;
  nameRu: string;
  nameKz: string;
  bg: string;
  primary: string;
  accent: string;
  text: string;
}> = [
  { id: 'bordeaux', nameRu: 'Бордо и золото', nameKz: 'Бордо мен алтын', bg: '#fff8f1', primary: '#6b1d3a', accent: '#c9a961', text: '#2c1810' },
  { id: 'rose', nameRu: 'Нежно-розовый', nameKz: 'Нәзік қызғылт', bg: '#fff5f7', primary: '#d88c9a', accent: '#c47b89', text: '#3d262b' },
  { id: 'mono', nameRu: 'Классика ч/б', nameKz: 'Классикалық ақ-қара', bg: '#ffffff', primary: '#18181b', accent: '#71717a', text: '#09090b' },
  { id: 'emerald', nameRu: 'Изумруд и золото', nameKz: 'Зүбәржат пен алтын', bg: '#f4f9f5', primary: '#1b4332', accent: '#b8956b', text: '#192820' },
];

const FONT_PAIRS: Array<{ id: string; name: string; heading: FontFamily; body: FontFamily }> = [
  { id: 'cormorant-montserrat', name: 'Cormorant + Montserrat', heading: 'Cormorant', body: 'Montserrat' },
  { id: 'yeseva-montserrat', name: 'Yeseva One + Montserrat', heading: 'Yeseva One', body: 'Montserrat' },
  { id: 'forum-montserrat', name: 'Forum + Montserrat', heading: 'Forum', body: 'Montserrat' },
];

const BACKGROUNDS: Array<{ id: string; nameRu: string; nameKz: string; color: string }> = [
  { id: 'ivory', nameRu: 'Слоновая кость', nameKz: 'Піл сүйегі', color: '#fff8f1' },
  { id: 'white', nameRu: 'Чистый белый', nameKz: 'Таза ақ', color: '#ffffff' },
  { id: 'dark', nameRu: 'Тёмный люкс', nameKz: 'Қою люкс', color: '#1b1419' },
  { id: 'rose-bg', nameRu: 'Пастельно-розовый', nameKz: 'Пастельді қызғылт', color: '#fff0f3' },
];

// Kazakh-verified fonts only — see KAZAKH_SUBSTITUTE in
// elements/fontStack.ts for why "supports Cyrillic" is not enough.
const FONT_OPTIONS: FontFamily[] = [
  'Cormorant', 'Montserrat', 'Forum', 'Inter', 'Raleway', 'Prata',
  'Pacifico', 'Yeseva One', 'Philosopher', 'system',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function EditorSheetTabDesign({ document, onDocumentChange }: Props) {
  const { locale } = useI18n();

  const setBg = useCallback(
    (patch: Partial<InvitationCanvasDocument['background']>) => {
      onDocumentChange({
        ...document,
        background: { ...document.background, ...patch },
      });
    },
    [document, onDocumentChange]
  );

  const applyPalette = (p: (typeof PALETTES)[0]) => {
    const nextElements: CanvasElement[] = document.elements.map((el) => {
      switch (el.type) {
        case 'text':         return { ...el, color: p.text } as CanvasElement;
        case 'heading':       return { ...el, color: p.primary } as CanvasElement;
        case 'couple-names': return { ...el, color: p.primary, connectorColor: p.accent } as CanvasElement;
        case 'divider':       return { ...el, color: p.accent } as CanvasElement;
        case 'countdown':     return { ...el, color: p.primary, accentColor: p.accent } as CanvasElement;
        case 'rsvp-form':     return { ...el, textColor: p.text, accentColor: p.accent } as CanvasElement;
        case 'wishes':        return { ...el, textColor: p.text, accentColor: p.accent } as CanvasElement;
        case 'gift':          return { ...el, accentColor: p.accent } as CanvasElement;
        case 'program':       return { ...el, textColor: p.text, accentColor: p.accent } as CanvasElement;
        case 'map':           return { ...el, accentColor: p.accent } as CanvasElement;
        case 'button':        return { ...el, bgColor: p.primary, textColor: p.bg } as CanvasElement;
        case 'music':         return { ...el, accentColor: p.accent } as CanvasElement;
        default:              return el;
      }
    });
    onDocumentChange({
      ...document,
      background: { type: 'solid', color: p.bg },
      elements: nextElements,
    });
  };

  const applyFontPair = (fp: (typeof FONT_PAIRS)[0]) => {
    const nextElements: CanvasElement[] = document.elements.map((el) => {
      switch (el.type) {
        case 'heading':       return { ...el, fontFamily: fp.heading } as CanvasElement;
        case 'text':          return { ...el, fontFamily: fp.body } as CanvasElement;
        case 'couple-names':  return { ...el, font: fp.heading } as CanvasElement;
        case 'rsvp-form':     return { ...el, fontFamily: fp.body } as CanvasElement;
        case 'wishes':        return { ...el, fontFamily: fp.body } as CanvasElement;
        case 'program':       return { ...el, fontFamily: fp.body } as CanvasElement;
        case 'button':        return { ...el, fontFamily: fp.body } as CanvasElement;
        default:              return el;
      }
    });
    onDocumentChange({ ...document, elements: nextElements });
  };

  const applyBg = (bg: (typeof BACKGROUNDS)[0]) => {
    setBg({ color: bg.color });
  };

  const bgColor = document.background?.color ?? '#fff8f1';
  const isRu = locale === 'ru';

  return (
    <div className="editor-sheet-section-stack editor-design-tab">
      {/* ── Background ─────────────────────────────────────────────── */}
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{isRu ? 'Фон' : 'Фон'}</h3>

        {/* Preset background swatches */}
        <div className="editor-design-bg-grid">
          {BACKGROUNDS.map((bg) => {
            const name = isRu ? bg.nameRu : bg.nameKz;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => applyBg(bg)}
                className={`editor-design-bg-swatch ${bgColor.toLowerCase() === bg.color.toLowerCase() ? 'is-active' : ''}`}
                title={name}
                aria-label={`${isRu ? 'Фон' : 'Фон'}: ${name}`}
              >
                <span
                  className="editor-design-bg-swatch__color"
                  style={{ backgroundColor: bg.color }}
                />
                <span className="editor-design-bg-swatch__label">{name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom background color */}
        <div className="editor-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <span className="editor-field-label" style={{ whiteSpace: 'nowrap' }}>{isRu ? 'Цвет' : 'Түс'}</span>
          <SwatchColorPicker
            value={bgColor}
            onChange={(c) => setBg({ color: c })}
          />
        </div>
      </div>

      {/* ── Envelope teaser ─────────────────────────────────────────── */}
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{isRu ? 'Конверт' : 'Конверт'}</h3>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!document.envelopeEnabled}
            onChange={(e) => onDocumentChange({ ...document, envelopeEnabled: e.target.checked })}
          />
          {isRu ? 'Показывать «нажмите, чтобы открыть»' : '«Ашу үшін басыңыз» экранын көрсету'}
        </label>
        <p className="ci-hint">
          {isRu
            ? 'Гость сначала увидит конверт, а приглашение откроется по нажатию.'
            : 'Қонақ алдымен конвертті көреді, шақыру түрткеннен кейін ашылады.'}
        </p>
      </div>

      {/* ── Autoscroll ───────────────────────────────────────────────── */}
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{isRu ? 'Автоскролл' : 'Автоскролл'}</h3>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!document.autoScroll?.enabled}
            onChange={(e) =>
              onDocumentChange({
                ...document,
                autoScroll: { enabled: e.target.checked, speed: document.autoScroll?.speed ?? 'normal' },
              })
            }
          />
          {isRu ? 'Страница сама медленно прокручивается' : 'Бет өзі баяу айналдырылады'}
        </label>
        {document.autoScroll?.enabled && (
          <div className="editor-field" style={{ flexDirection: 'row', gap: '6px' }}>
            {(['slow', 'normal', 'fast'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() =>
                  onDocumentChange({ ...document, autoScroll: { enabled: true, speed } })
                }
                className={`editor-chip ${document.autoScroll?.speed === speed ? 'is-active' : ''}`}
              >
                {isRu
                  ? { slow: 'Медленно', normal: 'Обычно', fast: 'Быстро' }[speed]
                  : { slow: 'Баяу', normal: 'Қалыпты', fast: 'Жылдам' }[speed]}
              </button>
            ))}
          </div>
        )}
        <p className="ci-hint">
          {isRu
            ? 'Отменяется, как только гость сам прокручивает страницу.'
            : 'Қонақ бетті өзі айналдырса — автоскролл тоқтайды.'}
        </p>
      </div>

      {/* ── Color palette presets ───────────────────────────────────── */}
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{isRu ? 'Цветовая палитра' : 'Түс палитрасы'}</h3>
        <div className="editor-design-palette-grid">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPalette(p)}
              className="editor-design-palette-card"
            >
              <div className="editor-design-palette-swatch-row">
                <span style={{ backgroundColor: p.bg, flex: 1, borderRadius: '4px 0 0 4px', display: 'block', height: '28px' }} />
                <span style={{ backgroundColor: p.primary, flex: 1 }} />
                <span style={{ backgroundColor: p.accent, flex: 1 }} />
              </div>
              <span className="editor-design-palette-name">{isRu ? p.nameRu : p.nameKz}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Font ───────────────────────────────────────────────────── */}
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{isRu ? 'Шрифт' : 'Қаріп'}</h3>

        {/* Font pair presets */}
        <div className="editor-design-font-pairs">
          {FONT_PAIRS.map((fp) => (
            <button
              key={fp.id}
              type="button"
              onClick={() => applyFontPair(fp)}
              className="editor-design-font-pair-btn"
            >
              <span className="editor-design-font-pair-name">{fp.name}</span>
              <span className="editor-design-font-pair-apply">{isRu ? 'Применить →' : 'Қолдану →'}</span>
            </button>
          ))}
        </div>

        {/* Manual font selector (sets heading font) */}
        <label className="editor-field">
          <span className="editor-field-label">{isRu ? 'Шрифт заголовков' : 'Тақырып қарпі'}</span>
          <select
            className="canvas-inspector-input"
            value={
              (document.elements.find((e) => e.type === 'heading') as { fontFamily?: FontFamily } | undefined)
                ?.fontFamily ?? 'Cormorant'
            }
            onChange={(e) => {
              const nextEls: CanvasElement[] = document.elements.map((el) =>
                el.type === 'heading' ? { ...el, fontFamily: e.target.value as FontFamily } : el
              );
              onDocumentChange({ ...document, elements: nextEls });
            }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label className="editor-field">
          <span className="editor-field-label">{isRu ? 'Шрифт текста' : 'Мәтін қарпі'}</span>
          <select
            className="canvas-inspector-input"
            value={
              (document.elements.find((e) => e.type === 'text') as { fontFamily?: FontFamily } | undefined)
                ?.fontFamily ?? 'Montserrat'
            }
            onChange={(e) => {
              const nextEls: CanvasElement[] = document.elements.map((el) =>
                el.type === 'text' ? { ...el, fontFamily: e.target.value as FontFamily } : el
              );
              onDocumentChange({ ...document, elements: nextEls });
            }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
