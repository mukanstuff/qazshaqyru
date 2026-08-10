# Canvas Engine (QazShaqyru Конструктор)

Новый ядро визуального редактора приглашений.

## Формат документа

`InvitationCanvasDocument` (src/lib/canvas/types.ts) — JSON-структура:

- `version` = 1.
- `width` — дизайн-ширина в px (390 для mobile-first, 1200 — desktop preview).
- `height` — либо пиксели, либо undefined для scroll-страницы.
- `background` — `{ type: 'solid'|'gradient'|'image'|'video', ... }`.
- `elements` — массив строго типизированных элементов (Text, Heading, Image, Button, Shape, Divider, CoupleNames, Countdown, RsvpForm, Wishes, Program, Map, Music, Gift, QrCode, Lottie, VideoBg, Ornament).
- `mobile` — опциональная версия документа под мобильный; если нет — рендерится десктопный с процентным пересчётом.

Координаты: `x`, `w` — в процентах от ширины, `y`, `h` — в px от верха. Все координаты абсолютные.
`rotation` в градусах, `zIndex` целое число.

## Как добавить новый тип элемента

1. Добавить интерфейс в `types.ts`: `XxxElement extends BaseElement { type: 'xxx'; ... }` и включить в union `CanvasElement`.
2. Добавить zod-схему в `schemas.ts` и в discriminatedUnion `canvasElementSchema`.
3. Добавить дефолтные размеры в `elementDefaultSize()` (`types.ts`).
4. Добавить дефолтные пропсы в `addElement()` (`mutations.ts`).
5. Создать компонент `src/components/canvas/elements/XxxElementView.tsx` и подключить его в `renderElement()` в `CanvasRenderer.tsx`.
6. Добавить пункт в палитру (`ElementPalette.tsx`) и контролы в `InspectorPanel.tsx`.
7. Добавить тест в `__tests__/schemas.test.ts` — валидные/невалидные примеры.

## Undo/redo

`HistoryStack` в `mutations.ts` хранит снимки (immutable clone). Каждая пользовательская операция (drag end, инспектор blur, добавление/удаление) вызывает `pushSnapshot(nextDoc)`; Ctrl+Z/Cmd+Z отматывает, Ctrl+Shift+Z — мотает вперёд.

## Конвертация legacy

Старые секционные приглашения (`templateData`/`customText`) автоматически конвертируются в canvas при открытии редактора:

- `convertLegacyToCanvas(inv)` — в `legacy-converter.ts` раскладывает wedding-luxury в набор элементов с вертикальными y-координатами: обложка, имена, дата, таймер, RSVP-кнопка, музыка.
- Гостевая страница `/i/[slug]` при наличии поля `canvas` у приглашения рендерит `CanvasRenderer`, иначе — старый `LayoutRouter`.

## Валидация

Вход из API валидируется через zod `canvasDocumentSchema` (`schemas.ts`). XSS-жёсткость: все URL-атрибуты проходят через `mediaSrc` / `safeUrl` — запрещены `javascript:`, `vbscript:`, `data:`, `blob:`; внешние ссылки — только `http(s)`.

## ⚠️ Известная проблема (2026-08-05)

**13 готовых секций в `sections.ts` (Hero / Дата-время / Место / Фото / Программа / Пожелания / RSVP / Dress Code / Подарки / Countdown / Текстовый блок / Hashtag / Спасибо) скрыты от обычного юзера.**

Причина: `ElementPalette.tsx:128` — `{isTemplateBuilder && (...)}`. Условие `isTemplateBuilder` срабатывает только если вызван из `/admin/templates/builder`. Юзер на `/invitations/[id]/canvas` не видит этих секций.

**Inspector обрабатывает только 4 из 17 типов** (`InspectorPanel.tsx:104-114`): text, heading, image, button, shape. После вставки countdown / rsvp-form / wishes / music / gift / map / qr / program / ornament / divider / lottie / video-bg / couple-names пользователь видит только PositionSection и CommonActions — то есть не может настроить 13 feature-rich элементов.

Фикс — этап 0 аудита: убрать `isTemplateBuilder` гард + добавить Inspector-секции для остальных 13 типов.

## Заметки по текущему состоянию

- Реализованы все 10 этапов по техническому заданию (v2):
  1. Ядро типов, zod-схем, валидации, мутаций и legacy-конвертера.
  2. Гостевой и редакторский рендерер (`CanvasRenderer`, `CanvasEditor`, `CanvasGuestPage`).
  3. Drag, Resize и Rotate с троттлингом через rAF (`useDrag`, `useResize`, `useRotate`) и брендовой рамкой выделения (`SelectionChrome`).
  4. Палитра с поддержкой drag-to-create (`ElementPalette`), сетка и направляющие выравнивания (`snapElementPosition`), контекстное меню по правой кнопке мыши (`ElementContextMenu`), поддержка горячих клавиш (Ctrl+Z, Ctrl+Y, Delete, Ctrl+D, Ctrl+C, Ctrl+V, стрелки).
  5. Полный набор функциональных элементов: `CountdownElementView`, `RsvpFormElementView`, `WishesElementView`, `MapElementView`, `MusicPlayerElementView`, `GiftBlockElementView`, `QrCodeElementView`, `ProgramElementView`, `OrnamentElementView`, `LottieElementView`, `VideoBgElementView`.
  6. Быстрый визард создания (`/create`) с 6 шагами (включая выбор цветовых схем), привязкой полей к `placeholderKey`, автосохранением в localStorage и проверкой тарифа перед переходом в продвинутый конструктор.
  7. Визуальная рассадка гостей (`VisualSeatingChart`) с интерактивными столами (круглые, прямоугольные, президиум, сцена), DnD гостей из списка, печатью/PDF, копированием ссылки для тойханы и переключением на список.
  8. Библиотека пресетов (`PresetLibraryModal`) для применения палитр, шрифтовых пар и фонов в один клик, а также paywall-проверка по тарифу (Стандарт и выше).
  9. Админ-режим создания шаблонов (`/admin/templates/builder`) без программирования с возможностью отмечать редактируемые поля (`editableByEndUser`, `placeholderKey`), клонировать, скрывать и удалять шаблоны.
  10. Аналитика открытий (`/api/invitations/[id]/event`), экспорт в календарь (.ics), массовая рассылка в WhatsApp и E2E тесты.
