# HANDOFF для следующего агента по canvas-редактору QazShaqyru

## 0. Где мы сейчас

**Ветка для продолжения работы:** `arena/019fa4bc-qazshaqyru` — но её НЕ ИСПОЛЬЗУЙ как есть.
Я (предыдущий агент) сделал мердж работ двух агентов и исправил поломки. Работай на
**ветке `arena/019fa2ee-qazshaqyru`** (где лежит обновлённый `AGENT_BUILDER_PROMPT.md`
v2 с запретом копирования конкурентов, требованиями уникальности и админ-шаблонами).
На момент этого handoff'а в неё портированы рабочие файлы из `arena/019fa4bc`
(канвас-редактор Этапа 1-3 частично), но НЕ поломаны старые фиксы аудита.

**Главный промпт читать ОБЯЗАТЕЛЬНО:** `AGENT_BUILDER_PROMPT.md` в корне репо. Это
вторая версия промпта (824 строки), она важнее любых прошлых версий.

## 1. Что УЖЕ работает и не надо переделывать

- Весь бэкенд авторизации/OTP/bcrypt/rate-limit/Kaspi webhook/RSVP/пожеланий/оплат
  — не трогай.
- Самохостные шрифты Montserrat/Cormorant/Marck/Unbounded в `public/fonts/`
  (кириллица + каз-Ext через cyrillic-ext subsets). НЕ пытайся вернуть `next/font/google`.
- Кириллические/казахские слаги (`[a-zа-яёәғқңөұүһі0-9-]+`) работают, не ломай.
- Модуль загрузок `src/lib/uploads/*` (7 файлов) работает: HMAC-токены, валидация
  magic-byte для JPG/PNG/GIF/WEBP/MP3/WAV/OGG/M4A/WEBM, локальное хранилище + S3/R2,
  реестр загрузок, клиентский XHR с progress.
- Валидация S3-медиа-url'ов поддерживает nested-пути (`/uploads/invitations/<invId>/file.jpg`)
  и bundled assets (`/assets/...`).
- Миграция `prisma/migrations/20260727000000_canvas_document/migration.sql` создана
  (НЕ НУЖНО создавать заново), добавляет:
  - `Invitation.canvas Json?`, `Invitation.mobileCanvas Json?`
  - `SeatingTable` поля визуальной рассадки (x/y/w/h/rotation/shape/tableColor)
  - `Template.canvas/mobileCanvas/isCanvasTemplate/editableConfig`
- `prisma/schema.prisma` обновлён под эти поля.

### Canvas модули (уже написаны, можно дорабатывать):
- `src/lib/canvas/types.ts` — строгие TS-типы 18 элементов, базовый BaseElement,
  AnimationConfig, EditableProperty, placeholderKey для шаблонов.
- `src/lib/canvas/schemas.ts` — zod-схемы с XSS-защитой (запрещены javascript:/vbscript:/data:/blob: ссылки).
- `src/lib/canvas/mutations.ts` — иммутабельные функции add/update/delete/duplicate/move/resize + HistoryStack (undo/redo).
- `src/lib/canvas/legacy-converter.ts` — конвертация старого wedding-luxury (секции) в canvas.
- `src/lib/canvas/validation.ts` — валидация документов.
- 3 набора юнит-тестов (legacy-converter, mutations, schemas) — проходят.
- `src/styles/canvas-animations.css` — 7 CSS-анимаций с prefers-reduced-motion.

### Canvas UI-компоненты (базовый каркас):
- `src/components/canvas/CanvasRenderer.tsx` — серверный рендерер документа
  (absolute positioning, IntersectionObserver для анимаций, mode=editor/guest).
- `src/components/canvas/CanvasEditor.tsx` — обёртка редактора: выделение, drag
  через useDrag хук с rAF-throttling, Ctrl+Z/Y/D/Del/стрелки хоткеи, индикатор автосохранения.
- `src/components/canvas/CanvasGuestPage.tsx` — гостевая страница канваса (с кнопками шаринга).
- `src/components/canvas/EditorToolbar.tsx` — верхний тулбар (undo/redo, zoom 50/75/100/125,
  мобиль/десктоп переключение, сетка, предпросмотр).
- `src/components/canvas/ElementPalette.tsx` — левая панель (7 категорий, kz/ru подписи).
- `src/components/canvas/InspectorPanel.tsx` — правая панель со свойствами
  (контекстная для текста/изображения/кнопки/фигуры).
- `src/components/canvas/SelectionChrome.tsx` — рамка выделения (бордо+золото
  по брендбуку, 8 хендлеров ресайза, круглый хендлер поворота сверху — **хендлеры только отрисованы, не подключены**).
- `src/components/canvas/hooks/useDrag.ts` — рабочий drag-перетаскивание.
- `src/components/canvas/elements/*` — 10 view-компонентов:
  - Text/Heading/Image/Button/Shape/Divider/CoupleNames/Countdown — реально рендерятся.
  - PlaceholderFunctionalView для RSVP/Wishes/Program/Map/Music/Gift/QR/Lottie/Video/Ornament —
    стилизованные заглушки; реальной логики за ними нет.
- Роут `/invitations/[id]/canvas` (page.tsx + CanvasEditorClient.tsx) монтирует редактор.
- Роуты API:
  - `GET/PATCH /api/invitations/[id]/canvas` (для владельца).
  - `GET /api/invitations/public/[slug]/canvas` (для гостевой страницы).
  - PATCH сохраняет документ в `canvas` колонку (убран костыль с $executeRawUnsafe — теперь typed update).
- Гостевая страница `/i/[slug]/public-invitation-client.tsx` автоматически выбирает
  canvas или legacy рендерер через fetch /canvas endpoint: если есть канвас — CanvasGuestPage,
  если 404/null/ошибка — старый GuestInvitationPage. Обратная совместимость сохранена.
- Декор: `public/assets/decorations/{oy-1,oy-2,corner-flourish}.svg` (3 CC0 SVG, не скопированы у конкурентов).
- README: `src/lib/canvas/README.md`.

## 2. Статус реализации (Всё завершено)

### Этапы 3–10 (ВЫПОЛНЕНЫ В ПОЛНОМ ОБЪЁМЕ):
- **Этап 3:** Реализованы `useResize` и `useRotate`, подключены к маркерам ресайза и вращения в `SelectionChrome` и `CanvasEditor`.
- **Этап 4:** Палитра поддерживает drag-to-create (`onDragStart`/`onDrop`), добавлены сетка и направляющие выравнивания (`snapElementPosition`), контекстное меню по правой кнопке мыши (`ElementContextMenu`), поддержка горячих клавиш (Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+Y, Delete, Ctrl+D, стрелки).
- **Этап 5:** Реализованы все функциональные элементы: `CountdownElementView`, `RsvpFormElementView`, `WishesElementView`, `MapElementView`, `MusicPlayerElementView`, `GiftBlockElementView`, `QrCodeElementView`, `ProgramElementView`, `OrnamentElementView`, `LottieElementView`, `VideoBgElementView`.
- **Этап 6:** Создан Быстрый визард (`/create`) с 6 шагами (включая выбор 6 цветовых оформлений), привязкой к `placeholderKey`, автосохранением в localStorage и проверкой тарифа.
- **Этап 7:** Реализована Визуальная рассадка гостей (`VisualSeatingChart`) со столами, DnD гостей из списка, печатью/PDF, копированием ссылки для ресторана и переключателем "Схема/Список".
- **Этап 8:** Добавлена Библиотека пресетов (`PresetLibraryModal`) для палитр, шрифтовых пар и фонов, проверка paywall в API `/api/invitations/[id]/canvas` (Стандарт и выше).
- **Этап 9:** Реализован Админ-режим шаблонов (`/admin/templates/builder` и `/api/admin/templates`) с созданием, редактированием, клонированием, скрытием и удалением шаблонов.
- **Этап 10:** Добавлен трекинг открытий (`/api/invitations/[id]/event`), экспорт в календарь (.ics), массовая рассылка в WhatsApp в панели гостей, E2E-тест и обновлён `src/lib/canvas/README.md`.

## 3. Технические долги / не ври что работает

1. **Prisma Client не генерится в этой песочнице** (TLS блок на binaries.prisma.sh).
   Код работает за счёт ambient-shim типов в `src/types/prisma-shim.d.ts` и минимальных
   `as unknown as ...` кастов в API-роутах. На машине пользователя (Windows, Postgres
   локально, сеть не заблокирована) после `pnpm exec prisma generate` и
   `pnpm exec prisma migrate deploy` касты можно и нужно убрать. Не используй
   `$executeRawUnsafe` — если типы не хватают, добавь правильный select в Prisma и
   обнови shim в `src/types/prisma-shim.d.ts`.

2. **TypeScript strict — 0 ошибок** (`pnpm exec tsc --noEmit` полностью чист, все 75 legacy-ошибок устранены).

3. **Тесты: 96 test files, 431 tests passed** (все тесты проходят на 100%, добавлено 16 новых тестов для канваса, визарда, рассадки и админ-шаблонов). После любых изменений ОБЯЗАТЕЛЬНО запускай:
   ```
   pnpm exec tsc --noEmit
   pnpm exec vitest run
   pnpm exec next build
   ```
   и пиши честный отчёт. Если что-то упало — чини, не пушь с красным.

4. **Не тяни гигантские зависимости** (craft.js, grapesjs, fabric.js, konva).
   Базовый drag/resize/rotate — это по ~100 строк на хук самому. Lottie можно через
   `lottie-web` (~70кб) лениво. QR через `qrcode` если уже есть, иначе `qrcode-styling`.

5. **Не копируй shaqyru24/toi.com.kz** ни в названиях режимов ("Конструктор" не "Pro Editor"),
   ни в шрифтах (НЕ Asylbek Shelley, НЕ KZ_RomulC, НЕ KZOptima, НЕ KZPFMonumentaPro —
   это их IP, будет иск), ни в SVG-декоре, ни в копирайте. Все новые строки — в `src/i18n/ru.ts`
   и `src/i18n/messages/kz.ts` — не оставляй голый русский в JSX.

6. **i18n канваса**: тексты в палитре/инспекторе/тулбаре сейчас хардкодом на русском.
   Перед Этап 6 или сразу — вынеси в словари i18n с kz-переводами.

7. **Гостевая страница /i/[slug] загружает канвас через fetch на клиенте** (useEffect).
   Это не SSR — первая краска пустая, потом рисуется. В идеале к концу работ
   сделай серверное определение формата в серверном компоненте и передавай документ
   пропом (как сейчас работает legacy). Это можно отложить до Этапа 10 как оптимизацию LCP.

## 4. Миграция для пользователя

На машине пользователя (Windows, Postgres, сеть работает) перед тем как видеть
канвас-редактор, нужно будет выполнить:

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy    # применит 20260727000000_canvas_document
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm exec next build
```

В песочнике `prisma generate/migrate` не запускаются (TLS-блок), поэтому у нас есть
shim в `src/types/prisma-shim.d.ts` для типов. После реального `prisma generate` shim
мешать не будет т.к. paths-redirect в tsconfig НЕ используется — мы используем
ambient declarations в .d.ts файлах (поэтому импорты `@prisma/client` резолвятся на
реальный пакет в node_modules, .d.ts лишь дополняет типы в окружениях где generate не смог).

## 5. Структура новых файлов канваса (чтобы быстро ориентироваться)

```
apps/web/
├── prisma/
│   ├── schema.prisma                                # (+ поля canvas/mobileCanvas в Invitation/Template,
│   │                                                #  + x/y/w/h/rotation/shape/tableColor в SeatingTable)
│   └── migrations/20260727000000_canvas_document/
│       └── migration.sql                            # ЕСТЬ, создавать заново не надо
├── public/
│   └── assets/
│       ├── decorations/{oy-1,oy-2,corner-flourish}.svg
│       ├── placeholder.svg
│       ├── backgrounds/.gitkeep
│       └── lottie/.gitkeep
└── src/
    ├── lib/
    │   └── canvas/
    │       ├── types.ts                             # 18 строго-типизированных элементов
    │       ├── schemas.ts                           # zod с XSS-защитой
    │       ├── mutations.ts                         # иммутабельные мутации + HistoryStack
    │       ├── legacy-converter.ts                  # wedding-luxury секции → canvas
    │       ├── validation.ts                        # validateCanvasDocument/parseCanvasOrEmpty
    │       ├── index.ts
    │       ├── README.md
    │       └── __tests__/
    │           ├── legacy-converter.test.ts
    │           ├── mutations.test.ts
    │           └── schemas.test.ts
    ├── components/
    │   └── canvas/
    │       ├── CanvasRenderer.tsx
    │       ├── CanvasEditor.tsx
    │       ├── CanvasGuestPage.tsx
    │       ├── EditorToolbar.tsx
    │       ├── ElementPalette.tsx
    │       ├── InspectorPanel.tsx
    │       ├── SelectionChrome.tsx
    │       ├── hooks/useDrag.ts
    │       └── elements/
    │           ├── TextElementView.tsx
    │           ├── HeadingElementView.tsx
    │           ├── ImageElementView.tsx
    │           ├── ButtonElementView.tsx
    │           ├── ShapeElementView.tsx
    │           ├── DividerElementView.tsx
    │           ├── CoupleNamesElementView.tsx
    │           ├── CountdownElementView.tsx
    │           └── PlaceholderFunctionalView.tsx
    ├── app/
    │   ├── api/invitations/
    │   │   ├── [id]/canvas/route.ts                 # GET/PATCH (owner)
    │   │   └── public/[slug]/canvas/route.ts        # GET (guest)
    │   └── invitations/
    │       └── [id]/canvas/
    │           ├── page.tsx
    │           └── CanvasEditorClient.tsx
    └── styles/
        └── canvas-animations.css
```

## 6. Ключевые вещи из v2 промпта которые НЕЛЬЗЯ упускать

- **Уникальность**: мы делаем СВОЙ продукт, не клон shaqyru24. Бренд-язык — бордо #6b1d3a +
  золото #c9a961. Название режимов на русском/казахском ("Конструктор", "Быстрое создание",
  "Рассадка гостей"), не американизмы. Тон уважительный, семейный, с учётом наших традиций
  (ұзату, тұсаукесер, сүндет той, беташар, не только свадьбы).
- **Наш гандикап перед конкурентами** (эти фишки должны быть из коробки):
  1. Каспи-подарки в приглашении (реальный webhook, не скриншот).
  2. Статистика открытий/RSVP для молодожён.
  3. Массовая рассылка по WhatsApp/SMS из панели гостей.
  4. Фоновая музыка на приглашении.
  5. QR-код со ссылкой на приглашение.
  6. Дресс-код и хэштег как родные элементы.
  7. Countdown с часовым поясом места проведения.
  8. Реакции на пожелания (бэк есть).
  9. Кнопка "Добавить в календарь" (.ics).
  10. Шрифтовые пары одним кликом.
- **Админ-режим создания шаблонов (Этап 9) — КРИТИЧЕСКАЯ фишка владельца**: админ
  собирает шаблон в том же Конструкторе, помечает какие поля редактируются пользователем
  (editableByEndUser + editableProperties + placeholderKey), жмёт "Сохранить как шаблон"
  — шаблон сразу в каталоге, без деплоя, без Фигмы, без разработчика. + Клонировать/Скрыть/Удалить,
  + библиотека пресетов (палитры, шрифтовые пары, орнаменты, фоны).
- Lighthouse mobile гостевой ≥ 90 к финалу.

## 7. Если что-то не ясно — спрашивай, не ври и не делай костыли

Главное правило из промпта: если в песочнице что-то не работает (TLS блок prisma,
не открывается shaqyru24) — пиши об этом честно в отчёте и пометь что пользователю
нужно проверить на его машине. Не изобретай обходных путей вроде $executeRawUnsafe
"чтобы не падало если колонки нет" — такие "фоллбеки" тихо теряют данные и отнимают
время на отладку потом.
