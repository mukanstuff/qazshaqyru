'use client';

/**
 * ContentPanel — names, date/time, location, RSVP, language.
 *
 * Uses primitives (TextInput, TextArea, Toggle, Pills) from primitives.tsx.
 * All visual styling lives in globals.css via .editor-pane-* classes.
 */

import { useCallback } from 'react';
import { useHtmlEditorStore, useHtmlEditorFields, useHtmlEditorRsvp } from '@/lib/templates/html-engine/editor/store';
import { MapPin, Phone, Users, Heart } from 'lucide-react';
import { PaneSection, PaneField, TextInput, TextArea, Toggle, Pills } from '../primitives';

export function ContentPanel() {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const rsvp = useHtmlEditorRsvp();

  const up = useCallback(
    (key: string, value: unknown) => store.updateField(key, value),
    [store],
  );

  return (
    <div>
      <PaneSection title="Имена пары">
        <div className="editor-pane-row">
          <PaneField label="Жених">
            <TextInput
              value={fields.groomName}
              onChange={(v) => up('groomName', v)}
              placeholder="Нурлан"
              maxLength={120}
            />
          </PaneField>
          <PaneField label="Невеста">
            <TextInput
              value={fields.brideName}
              onChange={(v) => up('brideName', v)}
              placeholder="Айгерим"
              maxLength={120}
            />
          </PaneField>
        </div>
      </PaneSection>

      <PaneSection title="Дата и время">
        <div className="editor-pane-row">
          <PaneField label="Дата">
            <TextInput
              value={fields.eventDate}
              onChange={(v) => up('eventDate', v)}
              type="date"
            />
          </PaneField>
          <PaneField label="Время">
            <TextInput
              value={fields.eventTime}
              onChange={(v) => up('eventTime', v)}
              type="time"
              placeholder="18:00"
            />
          </PaneField>
        </div>
        <PaneField label="Место">
          <TextInput
            value={fields.eventPlace}
            onChange={(v) => up('eventPlace', v)}
            placeholder="Ресторан «Жарық»"
            maxLength={300}
          />
        </PaneField>
      </PaneSection>

      <PaneSection title="Локация">
        <PaneField label="Ссылка на карту" hint="2GIS / Google Maps">
          <TextInput
            value={fields.mapUrl}
            onChange={(v) => up('mapUrl', v)}
            placeholder="https://2gis.kz/..."
            type="url"
            maxLength={300}
            icon={<MapPin className="h-4 w-4" />}
          />
        </PaneField>
        <PaneField label="Адрес">
          <TextInput
            value={fields.address}
            onChange={(v) => up('address', v)}
            placeholder="г. Алматы, ул. Абая 150"
            maxLength={500}
          />
        </PaneField>
      </PaneSection>

      <PaneSection title="Текст приглашения">
        <PaneField label="Обращение к гостям" hint="Видит каждый гость">
          <TextArea
            value={fields.greeting}
            onChange={(v) => up('greeting', v)}
            placeholder="Дорогие наши родные и друзья! Приглашаем вас разделить с нами самый счастливый день…"
            rows={4}
            maxLength={1000}
          />
        </PaneField>
      </PaneSection>

      <PaneSection title="Ответы гостей (RSVP)">
        <PaneField label="WhatsApp для ответов" hint="Гость увидит кнопку в RSVP">
          <TextInput
            value={fields.whatsappPhone}
            onChange={(v) => up('whatsappPhone', v)}
            placeholder="+7 700 000 00 00"
            type="tel"
            maxLength={30}
            icon={<Phone className="h-4 w-4" />}
          />
        </PaneField>

        <div className="editor-pane-card">
          <div className="editor-pane-card__title">Поля анкеты</div>
          <Toggle
            checked={rsvp.showPhone}
            onChange={(v) => store.updateRsvpField('showPhone', v)}
            label="Номер телефона"
          />
          <Toggle
            checked={rsvp.showGuestCount}
            onChange={(v) => store.updateRsvpField('showGuestCount', v)}
            label="Количество гостей"
          />
          <Toggle
            checked={rsvp.showWishes}
            onChange={(v) => store.updateRsvpField('showWishes', v)}
            label="Пожелание"
          />
          <p className="editor-pane-info" style={{ marginTop: 8 }}>
            <span>Имя и «Придёте?» показываются всегда</span>
          </p>
        </div>
      </PaneSection>

      <PaneSection title="Язык приглашения">
        <Pills
          ariaLabel="Язык приглашения"
          value={fields.locale}
          onChange={(v) => up('locale', v)}
          options={[
            { value: 'ru', label: '🇷🇺 Русский' },
            { value: 'kz', label: '🇰🇿 Қазақша' },
          ]}
        />
      </PaneSection>
    </div>
  );
}