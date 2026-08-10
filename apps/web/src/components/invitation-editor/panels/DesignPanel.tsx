'use client';

/**
 * DesignPanel — colors, animation, fonts, page behavior.
 *
 * Uses primitives. Visual styling lives in globals.css.
 */

import { useCallback, useMemo } from 'react';
import { useHtmlEditorStore, useHtmlEditorFields } from '@/lib/templates/html-engine/editor/store';
import { ANIMATION_OPTIONS } from '@/lib/templates/html-engine/editor/types';
import type { AnimationType } from '@/lib/templates/html-engine/editor/types';
import { PaneSection, PaneField, ColorPicker, Pills, Slider, Toggle } from '../primitives';

const BG_PRESETS = [
  '#e9e4dc', '#f5f0eb', '#fdf6ee', '#fef9f4',
  '#f0ece4', '#e8e0d8', '#d4c8b8', '#c8b89c',
  '#f8f4f0', '#fff8f0', '#fff0e8', '#ffe8d8',
  '#f3eee6', '#efe6da', '#fafafa', '#f4e8d8',
];

const ACCENT_PRESETS = [
  { color: '#c8a96a', label: 'Золото' },
  { color: '#8b6e4e', label: 'Бронза' },
  { color: '#c9a961', label: 'Латунь' },
  { color: '#a8c5b5', label: 'Мята' },
  { color: '#b5a8c5', label: 'Лаванда' },
  { color: '#c5b5a8', label: 'Капучино' },
  { color: '#a8c5d4', label: 'Небо' },
  { color: '#d4a8a8', label: 'Роза' },
];

const FONT_FAMILIES = [
  { value: '', label: 'Шаблонный' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Caveat', label: 'Caveat' },
];

export function DesignPanel() {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();

  const up = useCallback(
    (key: string, value: unknown) => store.updateField(key, value),
    [store],
  );

  const enterAnims = useMemo(() => ANIMATION_OPTIONS.filter((a) => a.kind === 'enter'), []);
  const loopAnims = useMemo(() => ANIMATION_OPTIONS.filter((a) => a.kind === 'loop'), []);

  return (
    <div>
      <PaneSection title="Цвет фона" hint="Пусто — шаблонный">
        <ColorPicker
          value={fields.backgroundColor}
          onChange={(v) => up('backgroundColor', v)}
          presets={BG_PRESETS}
          placeholder="#e9e4dc"
        />
        {fields.backgroundColor ? (
          <button
            type="button"
            onClick={() => up('backgroundColor', '')}
            className="editor-btn editor-btn--ghost editor-btn--block"
          >
            Сбросить
          </button>
        ) : null}
      </PaneSection>

      <PaneSection title="Акцентный цвет">
        <PaneField label="Режим">
          <Pills
            ariaLabel="Режим акцента"
            value={fields.accentColorMode}
            onChange={(v) => up('accentColorMode', v)}
            options={[
              { value: 'default', label: 'Шаблонный' },
              { value: 'custom', label: 'Свой' },
            ]}
          />
        </PaneField>
        {fields.accentColorMode === 'custom' ? (
          <PaneField label="Цвет">
            <ColorPicker
              value={fields.accentColor}
              onChange={(v) => up('accentColor', v)}
              presets={ACCENT_PRESETS.map((p) => p.color)}
              placeholder="#c8a96a"
            />
            <div className="editor-pane-pills" role="group" aria-label="Пресеты">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  aria-pressed={fields.accentColor === p.color}
                  onClick={() => up('accentColor', p.color)}
                  className="editor-pane-pill"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: p.color }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </PaneField>
        ) : null}
      </PaneSection>

      <PaneSection title="Анимация">
        <PaneField label="Скорость" hint={`${fields.animationDuration.toFixed(1)} сек`}>
          <Slider
            value={fields.animationDuration}
            onChange={(v) => up('animationDuration', v)}
            min={1}
            max={6}
            step={0.5}
            formatValue={(v) => `${v.toFixed(1)}s`}
            leftLabel="Медленно"
            rightLabel="Быстро"
          />
        </PaneField>

        <div className="editor-pane-anim__group">
          <p className="editor-pane-anim__group-title">Вход</p>
          <div className="editor-pane-anim">
            {enterAnims.map((anim) => (
              <button
                key={anim.value}
                type="button"
                aria-pressed={fields.animationType === anim.value}
                onClick={() => up('animationType', anim.value as AnimationType)}
                className="editor-pane-anim__cell"
                title={anim.labelRu}
              >
                <span className="editor-pane-anim__icon">{anim.icon}</span>
                <span className="editor-pane-anim__label">{anim.labelRu}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="editor-pane-anim__group">
          <p className="editor-pane-anim__group-title">Повтор</p>
          <div className="editor-pane-anim">
            {loopAnims.map((anim) => (
              <button
                key={anim.value}
                type="button"
                aria-pressed={fields.animationType === anim.value}
                onClick={() => up('animationType', anim.value as AnimationType)}
                className="editor-pane-anim__cell"
                title={anim.labelRu}
              >
                <span className="editor-pane-anim__icon">{anim.icon}</span>
                <span className="editor-pane-anim__label">{anim.labelRu}</span>
              </button>
            ))}
          </div>
        </div>
      </PaneSection>

      <PaneSection title="Поведение страницы">
        <Toggle
          checked={fields.autoScroll}
          onChange={(v) => up('autoScroll', v)}
          label="Автопрокрутка"
          hint="Страница сама медленно прокручивается вниз"
        />
        <Toggle
          checked={fields.showEnvelope}
          onChange={(v) => up('showEnvelope', v)}
          label="Конверт-превью"
          hint="При открытии показывается «Нажмите, чтобы открыть». Включает музыку."
        />
      </PaneSection>

      <PaneSection title="Шрифты">
        <PaneField label="Шрифт всего приглашения" hint="Применяется ко всему тексту">
          <Pills
            ariaLabel="Режим шрифта"
            value={fields.fontMode}
            onChange={(v) => up('fontMode', v)}
            options={[
              { value: 'template', label: 'Шаблонный' },
              { value: 'custom', label: 'Свой' },
            ]}
          />
          {fields.fontMode === 'custom' ? (
            <div className="editor-pane-pills" role="group" aria-label="Шрифты">
              {FONT_FAMILIES.filter((f) => f.value).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={fields.fontFamily === f.value}
                  onClick={() => up('fontFamily', f.value)}
                  className="editor-pane-pill"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
        </PaneField>

        <PaneField label="Шрифт нового текста" hint="Только к новому тексту">
          <Pills
            ariaLabel="Режим нового шрифта"
            value={fields.newTextFontMode}
            onChange={(v) => up('newTextFontMode', v)}
            options={[
              { value: 'environment', label: 'Как у окружения' },
              { value: 'custom', label: 'Свой' },
            ]}
          />
          {fields.newTextFontMode === 'custom' ? (
            <div className="editor-pane-pills" role="group" aria-label="Шрифты">
              {FONT_FAMILIES.filter((f) => f.value).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={fields.newTextFontFamily === f.value}
                  onClick={() => up('newTextFontFamily', f.value)}
                  className="editor-pane-pill"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
        </PaneField>
      </PaneSection>
    </div>
  );
}