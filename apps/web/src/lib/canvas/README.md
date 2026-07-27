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

## Заметки по текущему состоянию

- Реализованы: ядро типов/схем/мутаций, рендерер (гостевой), базовый редактор с drag/drop/selection, Inspector для текста/изображения/кнопки/фигуры, палитра элементов, undo/redo, горячие клавиши, автосохранение 1с debounce, анимации.
- Функциональные элементы RSVP/Wishes/Program/Map/Music/Gift/QR/Lottie/VideoBg/Ornament рендерятся как плейсхолдеры и ожидают подключения существующих бэкенд-компонентов на следующих этапах.
- Визард быстрого создания, визуальная рассадка и админ-шаблоны — в разработке.
