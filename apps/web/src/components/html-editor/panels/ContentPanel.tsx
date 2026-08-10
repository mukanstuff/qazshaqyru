'use client';

/**
 * ContentPanel — editor tab for text content, date/location, and RSVP fields.
 */

import { useCallback } from 'react';
import { useHtmlEditorStore, useHtmlEditorFields, useHtmlEditorRsvp } from '@/lib/templates/html-engine/editor/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Users, Heart } from 'lucide-react';
import { cn } from '@/lib/shared/utils';

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

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <Input
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      maxLength={maxLength}
      className="h-10 rounded-xl border border-white/10 bg-white/5 font-body text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
    />
  );
}

function TextAreaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
    />
  );
}

function ToggleBtn({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
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
  );
}

export function ContentPanel() {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const rsvpFields = useHtmlEditorRsvp();

  // Typed field updater
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const up = (key: string, value: any) => store.updateField(key, value);
  const updateRsvpField = (key: string, value: unknown) => store.updateRsvpField(key as never, value as never);

  return (
    <div className="space-y-8 p-5">
      {/* ── Couple names ─────────────────────────────────────────────── */}
      <Section title="Имена пары">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Имя жениха">
            <TextInput
              value={fields.groomName}
              onChange={(v: string) => up('groomName', v)}
              placeholder="Нурлан"
            />
          </Field>
          <Field label="Имя невесты">
            <TextInput
              value={fields.brideName}
              onChange={(v: string) => up('brideName', v)}
              placeholder="Айгерим"
            />
          </Field>
        </div>
      </Section>

      {/* ── Date, time, venue ───────────────────────────────────────── */}
      <Section title="Дата и время">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата">
            <TextInput
              value={fields.eventDate}
              onChange={(v: string) => up('eventDate', v)}
              type="date"
            />
          </Field>
          <Field label="Время">
            <TextInput
              value={fields.eventTime}
              onChange={(v: string) => up('eventTime', v)}
              type="time"
              placeholder="18:00"
            />
          </Field>
        </div>
        <Field label="Место проведения">
          <TextInput
            value={fields.eventPlace}
            onChange={(v: string) => up('eventPlace', v)}
            placeholder="Ресторан «Жарық», г. Алматы"
          />
        </Field>
      </Section>

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <Section title="Карта">
        <Field
          label="Ссылка на карту"
          hint="Скопируйте ссылку из 2GIS или Google Maps"
        >
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <TextInput
              value={fields.mapUrl}
              onChange={(v: string) => up('mapUrl', v)}
              placeholder="https://2gis.kz/almaty/geo/..."
              type="url"
            />
          </div>
        </Field>
        <Field label="Адрес">
          <TextInput
            value={fields.address}
            onChange={(v: string) => up('address', v)}
            placeholder="г. Алматы, ул. Абая 150"
          />
        </Field>
      </Section>

      {/* ── Greeting text ────────────────────────────────────────────── */}
      <Section title="Текст приглашения">
        <Field
          label="Обращение к гостям"
          hint="Видит каждый гость в начале приглашения"
        >
          <TextAreaInput
            value={fields.greeting}
            onChange={(v: string) => up('greeting', v)}
            placeholder="Дорогие наши родные и друзья! Приглашаем вас разделить с нами самый счастливый день нашей жизни!"
            rows={4}
            maxLength={1000}
          />
        </Field>
      </Section>

      {/* ── WhatsApp RSVP ────────────────────────────────────────────── */}
      <Section title="Ответы гостей (RSVP)">
        <Field
          label="Номер WhatsApp"
          hint="Кнопка «Ответить в WhatsApp» в RSVP откроет чат с этим номером"
        >
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <TextInput
              value={fields.whatsappPhone}
              onChange={(v: string) => up('whatsappPhone', v)}
              placeholder="+7 700 000 00 00"
              type="tel"
            />
          </div>
        </Field>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="font-body text-xs text-white/40">Поля анкеты</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-white/40" />
                <span className="font-body text-sm text-white/80">Номер телефона</span>
              </div>
              <ToggleBtn
                checked={rsvpFields.showPhone}
                onChange={(v: boolean) => updateRsvpField('showPhone', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-white/40" />
                <span className="font-body text-sm text-white/80">Количество гостей</span>
              </div>
              <ToggleBtn
                checked={rsvpFields.showGuestCount}
                onChange={(v: boolean) => updateRsvpField('showGuestCount', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-white/40" />
                <span className="font-body text-sm text-white/80">Пожелание</span>
              </div>
              <ToggleBtn
                checked={rsvpFields.showWishes}
                onChange={(v: boolean) => updateRsvpField('showWishes', v)}
              />
            </div>
          </div>
          <p className="font-body text-xs text-white/25">
            Имя и «Придёте?» показываются всегда
          </p>
        </div>
      </Section>

      {/* ── Language toggle ─────────────────────────────────────────── */}
      <Section title="Язык приглашения">
        <div className="flex gap-2">
          {(['ru', 'kz'] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => up('locale', loc)}
              className={cn(
                'flex-1 rounded-xl border py-2.5 text-center font-body text-sm font-medium transition-all',
                fields.locale === loc
                  ? 'border-[#16A34A] bg-[#16A34A]/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
              )}
            >
              {loc === 'ru' ? '🇷🇺 Русский' : '🇰🇿 Қазақша'}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
