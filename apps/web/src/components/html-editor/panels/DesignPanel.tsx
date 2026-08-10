'use client';

/**
 * DesignPanel — editor tab for visual design: colors, animation, fonts.
 */

import { useCallback } from 'react';
import { useHtmlEditorStore, useHtmlEditorFields } from '@/lib/templates/html-engine/editor/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/shared/utils';
import { ANIMATION_OPTIONS } from '@/lib/templates/html-engine/editor/types';
import type { AnimationType } from '@/lib/templates/html-engine/editor/types';

const COLOR_PRESETS = [
  '#e9e4dc', '#f5f0eb', '#fdf6ee', '#fef9f4',
  '#f0ece4', '#e8e0d8', '#d4c8b8', '#c8b89c',
  '#f8f4f0', '#fff8f0', '#fff0e8', '#ffe8d8',
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-white/30">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-sm text-white/80">{label}</Label>
      {children}
      {hint ? <p className="font-body text-xs text-white/30">{hint}</p> : null}
    </div>
  );
}

function ToggleBtn({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-white/80">{label}</p>
        {hint ? <p className="font-body text-xs text-white/30">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
          checked ? 'border-[#16A34A] bg-[#16A34A]' : 'border-white/20 bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export function DesignPanel() {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const up = (key: string, value: any) => store.updateField(key, value);

  const enterAnimations = ANIMATION_OPTIONS.filter((a) => a.kind === 'enter');
  const loopAnimations = ANIMATION_OPTIONS.filter((a) => a.kind === 'loop');

  return (
    <div className="space-y-8 p-5">
      {/* ── Background color ─────────────────────────────────────────── */}
      <Section title="Цвет фона">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10"
            style={{ background: fields.backgroundColor || '#e9e4dc' }}
          />
          <div className="min-w-0 flex-1">
            <Input
              value={fields.backgroundColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => up('backgroundColor', e.target.value)}
              placeholder="#e9e4dc"
              maxLength={7}
              className="h-10 rounded-xl border border-white/10 bg-white/5 font-mono text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
            />
          </div>
          <button
            type="button"
            onClick={() => up('backgroundColor', '')}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-body text-xs text-white/40 hover:border-white/20 hover:text-white/60"
          >
            Сброс
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => up('backgroundColor', color)}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-all',
                fields.backgroundColor === color
                  ? 'border-white scale-110'
                  : 'border-transparent hover:border-white/30'
              )}
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>
        <p className="font-body text-xs text-white/30">
          Лучше работают светлые пастельные оттенки. Пусто — шаблонный цвет.
        </p>
      </Section>

      {/* ── Accent color ───────────────────────────────────────────── */}
      <Section title="Акцентный цвет">
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => up('accentColorMode', 'default')}
              className={cn(
                'flex-1 rounded-xl border py-2 text-center font-body text-sm transition-all',
                fields.accentColorMode === 'default'
                  ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
              )}
            >
              По умолчанию
            </button>
            <button
              type="button"
              onClick={() => up('accentColorMode', 'custom')}
              className={cn(
                'flex-1 rounded-xl border py-2 text-center font-body text-sm transition-all',
                fields.accentColorMode === 'custom'
                  ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
              )}
            >
              Свой цвет
            </button>
          </div>

          {fields.accentColorMode === 'custom' && (
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-xl border border-white/10"
                style={{ background: fields.accentColor }}
              />
              <Input
                value={fields.accentColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => up('accentColor', e.target.value)}
                placeholder="#c8a96a"
                maxLength={7}
                className="h-10 rounded-xl border border-white/10 bg-white/5 font-mono text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map(({ color, label: presetLabel }) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  up('accentColorMode', 'custom');
                  up('accentColor', color);
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-body text-xs transition-all hover:border-white/30',
                  fields.accentColor === color && fields.accentColorMode === 'custom'
                    ? 'border-white bg-white/10 text-white'
                    : 'text-white/60'
                )}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                {presetLabel}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Animation ──────────────────────────────────────────────── */}
      <Section title="Анимация появления">
        <div className="space-y-3">
          {/* Speed */}
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/80">Скорость</span>
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-white/40">Медленно</span>
              <input
                type="range"
                min={1}
                max={6}
                step={0.5}
                value={fields.animationDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  up('animationDuration', parseFloat(e.target.value))
                }
                className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#16A34A]"
              />
              <span className="font-body text-xs text-white/40">Быстро</span>
            </div>
          </div>

          {/* Enter animations */}
          <div>
            <p className="mb-2 font-body text-xs text-white/40">Вход</p>
            <div className="grid grid-cols-4 gap-1.5">
              {enterAnimations.map((anim) => (
                <button
                  key={anim.value}
                  type="button"
                  onClick={() => up('animationType', anim.value)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl border py-2 transition-all',
                    fields.animationType === anim.value
                      ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                  title={anim.labelRu}
                >
                  <span className="text-base leading-none">{anim.icon}</span>
                  <span className="font-body text-[10px] leading-tight">{anim.labelRu}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loop animations */}
          <div>
            <p className="mb-2 font-body text-xs text-white/40">Повтор</p>
            <div className="grid grid-cols-4 gap-1.5">
              {loopAnimations.map((anim) => (
                <button
                  key={anim.value}
                  type="button"
                  onClick={() => up('animationType', anim.value)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl border py-2 transition-all',
                    fields.animationType === anim.value
                      ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                  title={anim.labelRu}
                >
                  <span className="text-base leading-none">{anim.icon}</span>
                  <span className="font-body text-[10px] leading-tight">{anim.labelRu}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Scroll + Envelope ─────────────────────────────────────── */}
      <Section title="Поведение страницы">
        <ToggleBtn
          label="Автопрокрутка"
          hint="Страница сама медленно прокручивается вниз"
          checked={fields.autoScroll}
          onChange={(v: boolean) => up('autoScroll', v)}
        />
        <ToggleBtn
          label="Конверт-превью"
          hint='При открытии показывается экран «Нажмите, чтобы открыть». Также включает музыку.'
          checked={fields.showEnvelope}
          onChange={(v: boolean) => up('showEnvelope', v)}
        />
      </Section>

      {/* ── Fonts ─────────────────────────────────────────────────── */}
      <Section title="Шрифты">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-body text-xs text-white/40">Основной шрифт</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => up('fontMode', 'template')}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-center font-body text-sm transition-all',
                  fields.fontMode === 'template'
                    ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                )}
              >
                Как в шаблоне
              </button>
              <button
                type="button"
                onClick={() => up('fontMode', 'custom')}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-center font-body text-sm transition-all',
                  fields.fontMode === 'custom'
                    ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                )}
              >
                Свой шрифт
              </button>
            </div>
            {fields.fontMode === 'custom' && (
              <Input
                value={fields.fontFamily}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => up('fontFamily', e.target.value)}
                placeholder="Cormorant Garamond"
                maxLength={100}
                className="mt-2 h-10 rounded-xl border border-white/10 bg-white/5 font-body text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
              />
            )}
          </div>

          <div>
            <p className="mb-1.5 font-body text-xs text-white/40">Шрифт нового текста</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => up('newTextFontMode', 'environment')}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-center font-body text-sm transition-all',
                  fields.newTextFontMode === 'environment'
                    ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                )}
              >
                Как у окружения
              </button>
              <button
                type="button"
                onClick={() => up('newTextFontMode', 'custom')}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-center font-body text-sm transition-all',
                  fields.newTextFontMode === 'custom'
                    ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                )}
              >
                Свой шрифт
              </button>
            </div>
            {fields.newTextFontMode === 'custom' && (
              <Input
                value={fields.newTextFontFamily}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => up('newTextFontFamily', e.target.value)}
                placeholder="Montserrat"
                maxLength={100}
                className="mt-2 h-10 rounded-xl border border-white/10 bg-white/5 font-body text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
              />
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
