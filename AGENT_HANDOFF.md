# Handoff — путеводитель по сервису

> Этот документ — **только универсальные знания**. Временные задачи, TODO, спринты и планы фиксов сюда НЕ класть. Для оперативного — `CHANGELOG.md` или issues. Кто пихнул сюда «починить X к пятнице» — тот сломал документ для всех будущих агентов.

---

## 0. Проект за 60 секунд

- **Что это**: конструктор свадебных (и других событийных) приглашений. Целевой рынок — Казахстан, обыватели с телефоном, **включая старшее поколение**. ~60% юзеров — mobile-only.
- **Критерий качества #1**: скорость редактора и понятность UI важнее функциональной полноты. Если фича ломает «за 3 тапа до результата» — её нет.
- **Монорепо**: `c:\shaqyru`. Все приложения в `apps/*`. **Всё, что тебе нужно — в `apps/web`**.
- **Dev server**: `http://localhost:3000`. Если занят — `:3001`. Запуск: `pnpm dev` из `apps/web`. Зависло: `taskkill /F /IM node.exe` → перезапуск.
- **Stack**: Next.js 14.2 (App Router) · PostgreSQL + Prisma · NextAuth (phone+OTP + Google OAuth) · ru/kz i18n · Tailwind + `globals.css`.

---

## 1. Архитектура рендеринга приглашений — ЭТО ГЛАВНОЕ, ЧТО НУЖНО ЗНАТЬ

Сервис имеет **четыре модели рендеринга**. Это самое частое место багов — агенты путают их.

| Модель | Где живёт | Что рисует | Используется на |
|---|---|---|---|
| **HTML-engine** | `lib/templates/manifests/index.ts` (канонический реестр) + `public/templates-html/<slug>/index.html` | Статический HTML-шаблон с `data-bind`, `data-i18n-kk/ru` атрибутами. SSR через Node.js FS. Никакого React на гостя. | `/i/[slug]` (для HTML-шаблонов), `/preview/[templateKey]` (HTML preview), `/i/demo?layout=<html-slug>` |
| **Manifest + Sections** | `lib/templates/manifests/*.ts` (`renderEngine: 'react-sections'`) | Декларативный манифест → `SectionRenderer` → секции (Hero, Date, Place, Countdown, Program, RSVP, ...). Ассеты: bgTexture, hero, frame, ornament, confetti, divider. | `/preview/[templateKey]`, `/invitations/[id]/canvas` (для manifest-templates), `/i/[slug]` (fallback) |
| **Canvas Document** | `Template.canvas` JSON + `lib/canvas/` (элементы: text/image/button/shape/...) | Прямоугольники с x/y/w/h/zIndex, рисует `CanvasRenderer` (`mode='editor'/'guest'`). | `/invitations/[id]/canvas` (для canvas-templates, custom-templates), `/i/[slug]` (fallback) |
| **Legacy layout config** | `lib/templates/*config*.ts` (старый) | `<LayoutConfig>` с разметкой секций. Закапывается. | Не использовать в новых фичах |

**Ключевые следствия**:

1. **HTML-engine — приоритет #1 для guest pages.** `/i/[slug]` сначала проверяет `getHtmlTemplateDescriptor(templateKey)`. Если дескриптор есть — гость получает чистый HTML (FCP ~2-3s). Если нет — React-sections или Canvas.
2. Для одного и того же `templateKey` (`wedding-luxury`) **существуют все три представления** одновременно. Manifest — канонический для sections-движка; `template.canvas` в БД — отдельный, **может быть пустым/битым**, и не должен быть источником правды.
3. HTML-engine подключён: `app/i/[slug]/page.tsx` → `HtmlGuestPage` → `resolveHtmlTemplateData` → `renderHtmlTemplate`. Для preview: `app/preview/[templateKey]/page.tsx` → `HtmlTemplatePreview`.
4. **Добавить новый HTML-шаблон**: создать `public/templates-html/<slug>/index.html` + зарегистрировать дескриптор в `lib/templates/manifests/index.ts`. Template HTML: `<div data-bind="groomName">`, `<p data-i18n-kk="..." data-i18n-ru="...">`.
5. Когда агент видит «в превью красиво, а в /canvas уродливо» — это значит одно из:
   - `/canvas` всё ещё рисует через `CanvasRenderer` (canvas-документ), а не через `SectionRenderer` (манифест). Решение — переключить на `ManifestCanvasClient` (`app/invitations/[id]/canvas/ManifestCanvasClient.tsx`).
   - `template.canvas` в БД не был засеян manifest-контентом и является fallback. Не пытаться его «починить» — он не используется.
6. Чтобы узнать, по какой модели рисуется шаблон, ищи в `lib/templates/manifests/index.ts`. Есть дескриптор → HTML-engine. Есть манифест → sections-движок. Нет → canvas-документ.

**Файлы HTML-engine (знать наизусть)**:

- `lib/templates/manifests/index.ts` — **канонический реестр** HTML-шаблонов. Все регистрации здесь.
- `lib/templates/html-engine/binder.ts` — заменяет `data-bind`, `data-i18n-kk/ru`, `data-bind-component` в HTML. **XSS-safe**, все значения через `escapeHtml()`.
- `lib/templates/html-engine/renderer.ts` — читает HTML-файл с диска, применяет binder, инжектит `<title>` и OG-метаданные.
- `lib/templates/html-engine/types.ts` — `HtmlTemplateDescriptor`, `HtmlTemplateData`, `HtmlTemplateField`.
- `lib/templates/html-engine/loader.ts` — path safety: отклоняет пути вне `public/templates-html/`.
- `app/i/[slug]/HtmlGuestPage.tsx` — server component для guest HTML-шаблонов.
- `app/i/[slug]/HtmlTemplatePreview.tsx` — server component для preview HTML-шаблонов.

**Файлы, которые нужно знать наизусть**:

- `app/invitations/[id]/canvas/page.tsx` — server-side диспетчер: manifest → `ManifestCanvasClient`, иначе → `CanvasEditorClient`. **Меняй здесь, когда добавляешь новый render engine.**
- `app/invitations/[id]/canvas/ManifestCanvasClient.tsx` — редактор для manifest-templates (использует `InvitationLayoutRouter` + `EditorToolbar`).
- `app/invitations/[id]/canvas/CanvasEditorClient.tsx` — редактор для canvas-templates (palette/inspector/stage).
- `components/invitation-layouts/LayoutRouter.tsx` — единый рендерер для `/preview`, `/i/[slug]`, `/canvas`. Умеет `isEditing` + `EditorToolbar`, `suppressGuestChrome`, `previewChrome='framed'|'wide'`, `wizardMode`.
- `components/invitation-layouts/SectionRenderer.tsx` — рендерит секции манифеста. **Ниже-fold секции lazy-loaded через `next/dynamic({ ssr: false })`** для производительности.
- `components/canvas/CanvasRenderer.tsx` — рендерит canvas-document (`mode='editor'|'guest'`).
- `lib/templates/manifests/wedding-luxury.ts` — главный манифест (440+ строк, канонический «как должны выглядеть секции»).
- `lib/invitations/ensure-canvas.ts` — сидит `Invitation.canvas` (canvas-document) при создании, берёт `template.canvas` из БД. Не путать с manifest.

---

## 2. Ключевые роуты

| Route | Что делает |
|---|---|
| `/templates` | Галерея шаблонов |
| `/preview/[templateKey]` | Демо шаблона через манифест (`PreviewClient` + `InvitationLayoutRouter` с `suppressGuestChrome`) |
| `/invitations/[id]` | GuestOpsHub (владелец: гости, аналитика, оплата, «Редактировать оформление») |
| `/invitations/[id]/canvas` | **Редактор** (диспетчер: manifest vs canvas) |
| `/invitations/[id]/canvas?chrome=minimal` | Опция chrome для canvas-templates; для manifest-templates используется `previewChrome='framed'` |
| `/invitations/edit` | Legacy redirect — НЕ использовать в новом коде |
| `/i/[slug]` | Публичная гостевая страница (`public-invitation-client.tsx`) |
| `/admin` | Админка (template builder, пользователи) |
| `/dashboard` | Список приглашений владельца |
| `POST /api/invitations` | Создать приглашение. Zod: `invitationCreateBodySchema`. Шлёт `templateId` (UUID) + `templateKey`. |
| `PATCH /api/invitations/[id]` | Обновить поля / шаблон / customText / templateData |
| `GET /api/invitations/[id]/canvas` | Прочитать canvas-document |
| `PATCH /api/invitations/[id]/canvas` | Сохранить canvas-document |

---

## 3. Шаблоны багов (классы, не инциденты)

> Это **типичные** ошибки, которые повторяются. Если ты нашёл новую — добавь класс сюда. Если починил — оставь класс как напоминание.

### 3.1 useEffect deps с объектной идентичностью вместо значения

**Симптом**: `Warning: Maximum update depth exceeded` в `use-*.ts` файле.

**Причина**: в deps передаётся объект/массив, который пересоздаётся каждый рендер (`new Date(...)`, `{...spread}`, `[]`). React сравнивает по ссылке → effect срабатывает каждый раз → setState внутри effect → ререндер → новый объект → ...

**Лечение**: сравнивай примитивом. Для дат — `date.getTime()`. Для объектов — сериализуй в строку через `JSON.stringify` или вытащи одно стабильное поле.

**Где искать**: `apps/web/src/hooks/*.ts`, `apps/web/src/components/**/use*.ts`.

### 3.2 Strict Zod schema отвергает поля, которые шлёт клиент

**Симптом**: `400 validation_error`, `details.fieldErrors: { foo: ['Unrecognized key(s)'] }`.

**Причина**: `z.object({...}).strict()` — лишние ключи ругаются. Клиент расширяет payload дополнительными полями (часто: `groomName`/`brideName`, добавляемые wizard'ом в `customText`).

**Лечение**:
- **Предпочтительно**: добавить поле в schema с правильным валидатором и `optional()`.
- **Запасной**: убрать `.strict()` (но тогда теряешь защиту от типо-багов).
- **Анти-паттерн**: убрать `.strict()` глобально, чтобы «починить» — не делай.

**Где искать**: `apps/web/src/lib/**/*.ts` — все `*.schema.ts`, `schemas.ts`.

### 3.3 Parallel render engines дают разные картинки на разных роутах

См. раздел 1. Это **архитектурный**, не баг. Не пытайся «синхронизировать» `template.canvas` с манифестом — они про разное.

### 3.4 API route не логирует ZodIssue details

**Симптом**: фронт получает 400, агент не знает какое поле, приходится просить у пользователя Network → Response.

**Лечение при разработке**: временно добавить `console.error('ZodIssues', result.error.issues)` в route handler. Убрать перед мерджем (или обернуть в dev-only условие).

**Где искать**: `apps/web/src/app/api/**/route.ts`.

### 3.5 DB query с `select` не покрывает поля, которые читаются ниже

**Симптом**: `TypeError: Cannot read property 'foo' of undefined` или `null` в рантайме, хотя TypeScript компилит.

**Причина**: `prisma.findUnique({ select: { id: true } })` → потом читаешь `inv.title`. TypeScript не помогает, потому что `as any` или `as Record<string, unknown>`.

**Лечение**: расширь `select` или добавь `as const` и узкий тип. Не «лечи» через `?? ''` если поле логически обязательно.

### 3.6 Date/timezone без явного TZ

**Симптом**: SSR/CSR hydration mismatch, «вчера» вместо «завтра», countdown считает неправильно.

**Причина**: `new Date('2026-12-12')` (парсится как UTC midnight), `new Date(dateStr + 'T' + timeStr)` (локальное время без TZ). Сервер один TZ, клиент другой.

**Лечение**: всегда хранить ISO-строкой + явный `eventTimezone` (по умолчанию `Asia/Almaty`). Парсить через `resolveEventDateTime(date, time, timezone)` (`lib/shared/event-datetime.ts`).

**Где искать**: `apps/web/src/components/invitation-layouts/sections/CountdownSection.tsx` и все места, где парсится дата/время.

### 3.7 Silent catch без user feedback

**Симптом**: кнопка не реагирует, в UI ничего, в консоли только `console.error`.

**Лечение**: всегда показывать toast (`useToast()`) на ошибку для юзера. `console.error` — для разработчика.

**Где искать**: `apps/web/src/components/**/use*.ts`, `apps/web/src/lib/invitations/*-client.ts`.

### 3.8 Клики «не нажимаются» (react навечно зациклен)

**Симптом**: вся UI мертвая, кнопки не реагируют, консоль забита `Maximum update depth exceeded`.

**См. также**: 3.1. Это каскад 3.1. Если в одном компоненте бесконечный цикл — **вся** страница может выглядеть мёртвой. **Первым делом** ищи `useEffect` с setState в console stack trace.

### 3.9 Canvas-document vs manifest путаница

**Симптом**: агент пишет «починю template.canvas для wedding-luxury», ломает ещё больше.

**Лечение**: см. раздел 1. Не прикасайся к `Template.canvas` в БД для sections-шаблонов.

---

## 4. CSS / Tailwind — НЕ дублируй workspace rule

Полные правила по CSS живут в `c:\shaqyru\.cursor\rules\verify-css-changes.mdc` (workspace rule). Пересказывать здесь не нужно.

Ключевое напоминание: изменения runtime стилей — в `apps/web/src/app/globals.css`, не в `tailwind.config.ts`. После правок проверять `/_next/static/css/app/layout.css`.

---

## 5. База данных

- Schema: `apps/web/prisma/schema.prisma`.
- Команды: `prisma migrate dev` (локально), `prisma generate` (после изменения schema).
- Reset (осторожно, **убивает данные**): `prisma migrate reset`.
- `DATABASE_URL` — в `apps/web/.env.local` (см. `.env.example`).
- Для экспериментов с editor-store есть фикстуры в `editor-durability.test.ts` (БД не нужна).

**Типовые таблицы**:

- `User` — пользователь, `nextAuth`-связан.
- `Template` — шаблон. Поля: `slug`, `nameRu`, `isActive`, `canvas` (canvas-document), `priceKzt`, `defaultEventType`.
- `Invitation` — приглашение. Поля: `userId`, `slug`, `title`, `eventDate`, `eventTime`, `eventPlace`, `address`, `eventTimezone`, `templateId`, `templateKey`, `templateData` (JSON), `customText` (JSON), `canvas` (canvas-document; для manifest-templates обычно не используется), `status` (`draft|published|archived`).
- `Guest` — гости.
- `Order` — заказы на оплату.

---

## 6. Как работать с пользователем

### 6.1 Не врать

Только реальные факты. Если не знаешь — скажи «не знаю», не выдумывай.

### 6.2 Не делать предположений, которые нельзя проверить

Если не уверен — спроси или проверь через Read/Grep/Shell. «По-видимому», «вероятно», «обычно» — не ответы.

### 6.3 Каждое утверждение проверяемо

UX-фичи — прочитай код. Конкуренты — открой в браузере. Баг — воспроизведи, потом чини.

### 6.4 Перед изменениями — план

Если фича нетривиальная: план в 3-5 строк + success criteria. Если фича ломает архитектуру — план + альтернативы.

### 6.5 Когда я (агент) не могу проверить сам

Есть ситуации, где у агента нет доступа:

- **Залогиненная сессия пользователя**: я не могу войти за тебя через Google OAuth (требует интерактивный клик). Если нужны данные, которые доступны только в авторизованной сессии — попроси у пользователя **Network → Response body** в DevTools. Один тап, копи-паст.
- **Prisma-скрипты**: я могу запустить их, но **не из temp-папки** — Prisma клиент резолвится относительно `apps/web`. Создавай `apps/web/probe-*.cjs` и **удаляй после** (мусор).
- **psql**: в проекте не установлен. Используй node + Prisma.
- **Git push/PR**: только по явной просьбе пользователя.

### 6.6 Регламент пользователя

- Не делать несколько фич за раз. Один этап — спрашивать «куда дальше».
- Сначала фикс, потом features.
- Если агент устал/зациклился — **сказать** пользователю, не выдумывать план Z.
- Не устраивать 5-раундовые рефакторы ради «красоты», если работает.

---

## 7. Что у нас уже хорошо (НЕ ломать)

- `apps/web/src/lib/templates/html-engine/` — полный pipeline HTML-шаблонов: loader (path-safe), binder (XSS-safe, data-bind/i18n), renderer (SSR). Тесты покрывают end-to-end.
- `apps/web/src/lib/canvas/types.ts` — 17 типов элементов, типобезопасно.
- `apps/web/src/lib/canvas/mutations.ts` — иммутабельные мутации + HistoryStack (100).
- `apps/web/src/components/canvas/hooks/useDrag.ts`, `useResize.ts`, `useRotate.ts` — RAF-throttled, стабильные.
- `apps/web/src/lib/canvas/snap-guides.ts` — snap во время drag.
- `apps/web/src/lib/canvas/sections.ts` — 13 готовых секций (Hero / Дата / Место / Фото / Программа / RSVP / Dress Code / Подарки / Countdown / Текстовый блок / Hashtag / Спасибо / Wishes). Дизайн продуман.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx` — единый рендерер для preview / public / canvas-edit. Поддерживает `isEditing`, `wizardMode`, `suppressGuestChrome`, `previewChrome`, `demoLayout`.
- `apps/web/src/components/invitation-layouts/SectionRenderer.tsx` — секции с lazy-load ниже fold. `next/dynamic({ ssr: false })` для: Calendar, Countdown, VenueMap, DressCode, Gallery, FinalText, RSVP, Wishes, KaspiGifts, Program, GuestTableNotice.
- `apps/web/src/app/api/invitations/[id]/canvas/route.ts` — zod-валидация, `ensureCanvasDocument`, keepalive save.
- `apps/web/src/components/invitation-layouts/manifests/wedding-luxury.ts` — канонический манифест, 440+ строк секций с реальными ассетами.

---

## 8. Конкуренты (для сравнения, когда проектируешь UX)

- **toi.com.kz** — UX-стандарт. Редактор открывается **на той же странице** (без редиректа). Правая панель 385px — единый длинный скролл «Все поля» (Дата / Цвет фона / Цвет акцента / Автопрокрутка / Конверт / Шрифт 40 / Локация / WhatsApp / RSVP-поля / Музыка / Галерея / OG-карточка / Slug). Попап «Добавить» → ткнуть в место. Bottom dock: Все поля / Секции / Музыка / Фото / Скрыть / Добавить / Отменить / Вернуть.
- **shaqyru24.kz** — лента слайдов + большая библиотека готовых шаблонов внутри редактора. Библиотека секций широкая: Жасау, Бесік, Тұсау, Крестины, Сундет, Той жинау, Тұған күн, Поминки, Беташар, Қыз ұзату, Келін түсіру, Никах, Шашу, Тост айту, ...

---

## 9. Если что-то сломалось — триггеры

1. **«UI мёртвая, ничего не нажимается»** → первым делом проверь консоль на `Maximum update depth exceeded`. Ищи хук с setState в useEffect. (3.1, 3.8.)
2. **«400 на API»** → проси у юзера Network → Response. Если в ответе `details.fieldErrors` — добавь поле в zod schema или убери `.strict()`. (3.2.)
3. **«В превью красиво, в /canvas уродливо»** → проверь, что `/canvas` использует manifest-engine (см. раздел 1). (3.9.)
4. **«Стили не применяются»** → см. workspace rule `verify-css-changes.mdc`.
5. **«Дата показывает неправильное»** → проверь TZ, используй `resolveEventDateTime`. (3.6.)
6. **«Сборка падает»** → `pnpm typecheck` (см. раздел 10).

---

## 10. Quality gates

Перед тем как сказать «готово»:

- `pnpm typecheck` — зелёный (или хотя бы твои изменения не добавили новых ошибок; существующие пре-экзистинг — отдельный issue).
- `pnpm test` — зелёный.
- Если правил CSS — проверил served CSS, не только tailwind.config (workspace rule).
- Если правил API — попробовал руками через curl с реальной сессией или попросил у юзера Network response.
- Если правил editor — открыл в браузере, ткнул руками, проверил оба chrome (`minimal`/`full`/`framed`).

---

## 11. Sensitive info

Не спрашивать и не выводить: `.env` содержимое, секреты, пароли, токены. Если нужны env vars для работы — указать пользователю создать `.env.local` по примеру `.env.example`.

---

## 12. Где НЕ хранить временные задачи

- ❌ `AGENT_HANDOFF.md` — этот файл. Только универсальные знания.
- ❌ Любые `AUDIT_*.md`, `TODO_*.md`, `ROADMAP_*.md` в корне или `docs/` — это временные отчёты, которые устаревают.
- ✅ `CHANGELOG.md` (если создашь) — история релизов.
- ✅ Issues / tasks / Linear / etc. — оперативное.
- ✅ Комментарии `// TODO: <date> <issue-id>` в коде — точечно, рядом с местом.

Если ты — агент, и тебя просят «обнови handoff списком TODO на следующую неделю» — **откажись**: документ сломается для следующего агента. Вместо этого предложи отдельный файл `docs/ROADMAP-2026-Wxx.md`.

---

## 13. TL;DR для агента с пустым контекстом

1. Сервис — Next.js + Prisma. Телефоны в Казахстане — главная аудитория.
2. У каждого шаблона **может быть манифест** (`lib/templates/manifests/*.ts`, секции) **или** canvas-документ (`Template.canvas`, прямоугольники). См. раздел 1.
3. `/canvas` использует манифест для sections-шаблонов, canvas-документ для canvas-templates.
4. CSS — в `globals.css`, не в `tailwind.config.ts`.
5. «UI мёртвая» = почти всегда `useEffect` с setState. Сначала консоль.
6. «400 API» = zod strict schema без нужного поля. См. Network response.
7. Не верь, что «похожий код работает так же» — прочитай и проверь.

---

## 14. Инвентарь паттернов — `path:line` примеры

> Этот раздел — **карта реальных мест**, где классы из раздела 3 уже встречались. Каждый пример — `path:line - суть`. Если ты открываешь новый код рядом — перепроверь, не воспроизводится ли паттерн.
>
> Перепроверяй: код двигается, строки ездят. Перед чтением — `git log -1 -- <file>`.

### 14.1 Autosave/race-condition

- `apps/web/src/components/canvas/CanvasEditor.tsx:94-180` — **главная бомба**. `saveTimer.current = setTimeout(...)` без `clearTimeout` в cleanup → stale save after unmount.
- `apps/web/src/components/canvas/CanvasEditor.tsx:178-180` — `useEffect([doc, scheduleSave])` вызывает `scheduleSave(doc)` на mount → лишний PATCH при первой загрузке.
- `apps/web/src/components/canvas/CanvasEditor.tsx:144-179` — `handleExportPNG` без AbortController → rapid clicks race.
- `apps/web/src/components/editor/DraftEditorLayout.tsx:200-249` — `saveToAccount` без AbortController: если юзер разлогинился mid-save, PATCH уйдёт с протухшей сессией.
- `apps/web/src/lib/invitations/draft-sync-client.ts:84-145` — цепочка fetch без AbortController; быстрое переключение между приглашениями в визарде → старый POST может перезаписать новый state.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:199, 226-262` — `loadInvitation()` срабатывает на смену `locale` без abort; два быстрых toggles = два ответа в произвольном порядке.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:373-378` — useEffect с `[..., shouldDelayMusicPrompt, hideGuestChrome]` — лишние триггеры когда `envelopeSeen` флипается.

### 14.2 Strict zod schemas (где стреляет)

- `apps/web/src/lib/shared/custom-text-schema.ts:10-39` — `.strict()` на customText; каждый новый wizard-поле → добавлять сюда или 400.
- `apps/web/src/lib/invitations/schemas.ts:57, 110, 148` — один strict schema переиспользуется в трёх разных request schemas — три независимых crash site.
- `apps/web/src/lib/templates/template-data-schema.ts:24-38` — `.catchall(z.unknown())` хорош, но `mediaUrlField()` тихо принимает пустые строки (silent acceptance).
- `apps/web/src/lib/__tests__/quick-wizard-schema.test.ts` — нет теста на unknown-field rejection (см. 14.13).

### 14.3 Parallel render engines

- `apps/web/src/lib/templates/configs.ts:6-32` — `TEMPLATE_CONFIGS['wedding-luxury']` (старая карта).
- `apps/web/src/lib/templates/manifests/wedding-luxury.ts:1-525` — `WEDDING_LUXURY_MANIFEST` (новая каноническая).
- `apps/web/src/lib/templates/html-template-renderer.tsx` — третий engine (iframe).
- `apps/web/src/lib/templates/manifests/wiring-stub.ts` — **shadow** template не в `TEMPLATE_CONFIGS`. Любой фикс в одной карте не отразится в другой.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:723-734` — runtime switch: manifest → SectionRenderer, иначе → PlaceholderLayout.

### 14.4 API 400 без server-side logging

`apiErrorResponse` в `apps/web/src/lib/shared/api.ts:32-49` логирует только non-`ApiError`. Когда `safeParse` → `throw new ApiError(...details: error.flatten()...)` — тело ответа несёт issues, но в логе пусто.

Где `parsed.error.flatten()` **не** пробрасывается и **не** логируется:

- `apps/web/src/app/api/invitations/[id]/canvas/route.ts:117-119, 122-124` — два fail-silent point.
- `apps/web/src/app/api/invitations/[id]/event/route.ts:21-24` — `return NextResponse.json({ok:false}, {status:400})` — **полностью silent**.
- `apps/web/src/app/api/invitations/[id]/family-preview/route.ts:53-56` — `customTextSchema.safeParse(merged)` без issues.
- `apps/web/src/app/api/invitations/[id]/seating/route.ts:89, 102, 141, 181` — четыре safeParse, четыре тихих провала.
- `apps/web/src/app/api/invitations/[id]/restaurant-share/route.ts:45`.
- `apps/web/src/app/api/invitations/[id]/guests/mark-sent/route.ts:48`.
- `apps/web/src/app/api/templates/waitlist/route.ts:37`.
- `apps/web/src/app/api/plans/agency/checkout/route.ts:45`.
- `apps/web/src/app/api/admin/orders/[id]/route.ts:35`.
- `apps/web/src/app/api/admin/templates/route.ts:29`.
- `apps/web/src/app/api/admin/templates/[id]/route.ts:69`.
- `apps/web/src/app/api/gifts/route.ts:42, 121`.
- `apps/web/src/app/api/wishes/[id]/react/route.ts:50, 58`.
- `apps/web/src/app/api/auth/google/exchange/route.ts:31`.
- `apps/web/src/app/api/orders/managed/route.ts:73`.
- `apps/web/src/app/api/users/me/route.ts:21`.
- `apps/web/src/app/api/ai/fill/route.ts:27` — verify flatten() passed.
- `apps/web/src/app/api/invitations/[id]/slug/route.ts:65` — verify.

Хорошие модели (pass `flatten()`):

- `apps/web/src/app/api/rsvp/open/route.ts:41-43`.
- `apps/web/src/app/api/invitations/[id]/checkout/route.ts` — pass `parsed.error.flatten()`.

### 14.5 setInterval/Timeout/listener cleanup

См. 14.1 — там же. Дополнительно:

- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:461-466` — `setTimeout(() => setCopied(false), 2000)` в `handleShare`, нет `clearTimeout` на unmount.
- Хорошие примеры с cleanup (для подражания):
  - `apps/web/src/components/canvas/elements/CountdownElementView.tsx:35-37`.
  - `apps/web/src/hooks/use-countdown-diff.ts:16`.
  - `apps/web/src/components/dashboard/PaymentPendingBanner.tsx:120-126`.

### 14.6 DB queries — `as any` / неполный `select`

- `apps/web/src/app/api/invitations/[id]/canvas/route.ts:69-78` — `select` без `mobileCanvas`; потом `(inv as any).canvas = refreshed.canvas`.
- `apps/web/src/app/api/invitations/public/[slug]/canvas/route.ts:83-89, 111-112` — то же + `(inv as any).mobileCanvas`.
- `apps/web/src/lib/invitations/ensure-canvas.ts:92` — `data: { canvas: doc as any }`.
- `apps/web/src/lib/invitations/publish-watermark.ts:26` — `(pricing as any).fullAccess`. **Ложный** as any — `fullAccess` есть в типе `InvitationPricing`. Удалить каст.
- `apps/web/src/app/(dashboard)/dashboard/page.tsx:78` — `as unknown as DashboardInvitation[]` для `_count.guests` — легитимный, но хрупкий.
- `apps/web/src/lib/invitations/InvitationService.ts:288` — `select: { id: true }` — проверить, не читаются ли ниже другие поля.
- `apps/web/src/lib/invitations/repositories/invitation-repository.ts:11` — то же.

### 14.7 Date/timezone

`new Date("YYYY-MM-DD")` парсится как **UTC midnight**, `.toLocaleDateString()` без `timeZone` форматирует в **локальной TZ рантайма** — различается на сервере и клиенте.

- `apps/web/src/components/quick-wizard/useWizardForm.ts:49, 118, 161` — `new Date(form.eventDate).toISOString()`.
- `apps/web/src/components/canvas/apply-wizard-placeholders.ts:35` — то же.
- `apps/web/src/lib/guests/calendar-ics.ts:24-37` — `setHours(...)` на UTC-midnight Date, игнорирует `eventTimezone`.
- `apps/web/src/app/i/[slug]/page.tsx:118-119` — `toLocaleDateString` без timezone в og/twitter metadata.
- `apps/web/src/app/blog/[slug]/page.tsx:43-57` — то же в блоге.
- `apps/web/src/app/blog/page.tsx:35` — то же.
- `apps/web/src/lib/seo/sitemap.ts:92, 99` — UTC midnight для date-only строк.
- `apps/web/src/app/api/og/route.tsx:86-90` — `Intl.DateTimeFormat('ru-RU', {...}).format(...)` без `timeZone` → og-картинка даты зависит от региона Vercel-функции.
- `apps/web/src/app/admin/orders/page.tsx:149`, `apps/web/src/app/admin/managed/page.tsx:75` — `toLocaleDateString('ru-RU')` на сервере.
- `apps/web/src/components/dashboard/AgencyPlanCard.tsx:28` — то же.
- `apps/web/src/components/restaurant/RestaurantPortalView.tsx:7` — то же.
- `apps/web/src/components/invitation-layouts/sections/CountdownSection.tsx:20-24` — **TZ-aware** через `resolveEventDateTime(...)` (хорошая модель).
- `apps/web/src/lib/shared/event-datetime.ts:34-81` — единственное место с правильной TZ-логикой, переиспользуй.

### 14.8 Race conditions (полный список)

См. 14.1.

### 14.9 i18n missing keys

`apps/web/src/i18n/index.tsx:47-56` — fallback: kz → ru → key-string. Нет consistency-теста. `kz.ts` типизирован как `Translations` (structural cast) — опечатки компилятся тихо.

Smoke-checked: namespaces `common, auth, nav, dashboard, paymentBanner, invitation, seating, public, events, orderForm, managedOrder, publishFlow, guidedFlow, familyPreview, postPublish, landing, errors, quickWizard, quickEdit, templatesPage, categoryPage, blog, site, settings, liveEditor` присутствуют в обоих файлах. Внутри каждого namespace листья могут расходиться — нужен type-test.

### 14.10 Hardcoded Russian/Kazakh в client-коде

- `apps/web/src/components/dashboard/RestaurantShareButton.tsx:43` — toast `'Ссылка для тойханы скопирована'`.
- `apps/web/src/components/admin/TemplateBuilderClient.tsx:41, 45, 68, 109, 116, 138` — toasts и placeholders.
- `apps/web/src/components/admin/TemplateAdminActions.tsx:25, 47, 50, 62, 65` — `'Успешно'`, `'Шаблон клонирован'`, `'Шаблон скрыт'`, `'Шаблон опубликован'`, `'Шаблон удалён'`.
- `apps/web/src/components/canvas/elements/WishesElementView.tsx:132, 145` — `placeholder="Ваше имя"`, `"Напишите тёплое пожелание..."`.
- `apps/web/src/components/canvas/elements/CountdownElementView.tsx:39` — `'күн'/'сағ'/'мин'/'сек'` (hardcoded kazakh).
- `apps/web/src/components/canvas/InspectorPanel.tsx:1068, 1523` — placeholders `"Открыть карту"`, `"Алматы, Ресторан Жетысу"`.
- `apps/web/src/components/admin/ManagedOrderStatusForm.tsx:77` — `"Заметки админа"`.
- `apps/web/src/components/editor/GuestsPanel.tsx:215, 385` — `"Семья / household"`.
- `apps/web/src/components/editor/VisualSeatingChart.tsx:339` — `"Поиск по имени..."`.
- `apps/web/src/components/editor/SeatingPanel.tsx:238` — `"Стол 1"`.
- `apps/web/src/components/invitation-layouts/sections/WishesSection.tsx:108, 132, 178` — hardcoded kazakh `'Ізгі тілектер:'`, `'ТІЛЕК ЖАЗУ'`, `'БАРЛЫҚ ТІЛЕКТЕРДІ ОҚУ'` при том что рядом же `t()`.
- `apps/web/src/components/invitation-layouts/sections/CountdownSection.tsx:15, 59` — `'ТОЙҒА ДЕЙІН ҚАЛҒАН УАҚЫТ:'`, `'ДО ТОРЖЕСТВА ОСТАЛОСЬ:'`, `'той уақыты:'`, `'время:'`.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:468-473` — share-text fallback hardcoded RU.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:60, 502` — hardcoded kazakh demo.
- `apps/web/src/lib/invitations/draft-sync-client.ts:88, 102, 107, 117, 122` — error messages в throw → попадают в UI toasts.
- `apps/web/src/components/editor/DraftEditorLayout.tsx:159, 341, 366` — `'Моё приглашение'`, `'Не удалось сохранить приглашение'` x2.

### 14.11 Client/server boundary

На сегодня **здоров**. Все импорты `@prisma/client` из client-кода — type-only (стираются при сборке). Никаких runtime `prisma from '@/lib/shared/db'` из `'use client'` файлов. Новый агент: добавляя client-компонент, не делай non-type `import { PrismaClient } from '@prisma/client'`.

### 14.12 Silent `catch {}` blocks

~12 мест по коду. Каждое по отдельности оправдано (localStorage, fallback кэша), но коллективно формируют «trust no absence of error logs». Особо отметить:

- `apps/web/src/app/api/og/route.tsx:163-164` — `catch { return 500 }` без `console.error`: image gen failures невидимы. Стоит логировать.
- `apps/web/src/components/invitation-layouts/LayoutRouter.tsx:180, 258, 369, 376, 381` — silent catch для localStorage/fetch. На production quota errors пропускаются тихо.

### 14.13 Тесты, которые не тестируют баг

- `apps/web/src/app/api/invitations/__tests__/route.integration.test.ts:53-126` — один happy-path POST/GET. Нет тестов на: invalid eventDate, missing templateId, customText с extra key (тот самый strict-schema fail). Все три бага, которые мы реально чинили, имели бы нулевое покрытие.
- `apps/web/src/lib/invitations/__tests__/custom-text-persistence.test.ts:1-55` — не assertит что diff с unknown key → падает.
- `apps/web/src/lib/__tests__/quick-wizard-schema.test.ts` — проверяет happy path, не assertит rejection unknown key.
- `apps/web/src/app/api/guests/__tests__/route.integration.test.ts` — verify happy only.
- `apps/web/src/app/api/rsvp/__tests__/route.integration.test.ts` — verify.
- `apps/web/src/app/api/wishes/__tests__/route.integration.test.ts` — verify.
- `apps/web/src/components/canvas/hooks/__tests__/useResize-useRotate.test.ts` — mock-heavy, не факт что выполняет реальный hook reducer.

`apiErrorResponse` helper **не покрыт ни одним тестом** — регрессия, ломающая error logging, проходит CI.

---

## 15. Когда видишь симптом — диагностический чек-лист

| Симптом | Сначала проверь | Где смотреть |
|---|---|---|
| UI мёртвая, ничего не нажимается | Консоль на `Maximum update depth exceeded` | `useEffect` с `setState` в deps (14.1) |
| `400` от API | Network → Response body | zod `.strict()` без нужного поля (14.2) |
| Server не пишет в логи про 400 | Это нормально для ~20 routes | см. 14.4 — convention drift |
| В превью красиво, в /canvas уродливо | manifest vs canvas | 14.3, раздел 1 |
| «Вчера» вместо «завтра» | TZ | 14.7 |
| «Save failed» в UI, ничего в консоли | catch без toast | 14.12, 3.7 |
| Locale kz, но русский текст | t() → fallback на ru | 14.9, 14.10 |
| После разлогина приходят PATCH | Stale fetch | 14.1, 14.8 |
| Тест проходит, prod падает | Test mock-heavy | 14.13 |

---

## 16. Метаправила документа

Этот файл **никогда не должен содержать**:

- ❌ TODO на ближайшую неделю.
- ❌ «P0 / P1 / P2» списки текущих багов.
- ❌ «План фиксов (этапы 0-5)».
- ❌ «Недавние изменения».
- ❌ Конкретные даты фиксов («починил 2026-08-05»).
- ❌ Удалённые/архивные отчёты (визуальные аудиты PNG, PRODUCT_DECISIONS, AUDIT_ISSUES).

Если тебя просят добавить сюда такое — **откажись**, предложи отдельный файл (`docs/ROADMAP-2026-Wxx.md`, `CHANGELOG.md`, issues).

Что **должен** содержать:

- ✅ Универсальные знания (любой новый агент с пустым контекстом выиграет).
- ✅ Классы типичных багов с `path:line` (раздел 14) — обновляются, когда новый баг того же класса найден.
- ✅ Карту архитектуры, которая не дрифтит (раздел 1).
- ✅ Правила взаимодействия с пользователем (раздел 6).
- ✅ Правила CSS/quality gates (ссылки наружу на workspace rules, разделы 4, 10).