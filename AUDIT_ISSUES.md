# AUDIT_ISSUES — QazShaqyru (диагноз, без правок)

> Дата: 2026-07-30 (UTC session 2026-07-29).  
> Ветка: `arena/019faf52-qazshaqyru` (база `0294b6b` / `arena/019fad2b-qazshaqyru`).  
> Тип: **только диагноз**. Код продукта не менялся.  
> Назначение: передать следующему агенту, который будет **планировать и делать** изменения.  
> Источник боли владельца: документ «AUDIT: состояние продукта QazShaqyru — прямая речь владельца» + бриф `docs/HANDOFF_SITE_CLEANUP_2026-07-29.md`.

---

## 0. Как читать

Владелец прав в главном: **сервис технически «не падает», но продуктово не готов**.  
Проблема не в одном баге. Проблема в том, что в коде **живут несколько несовместимых моделей продукта**, и UI/копирайт уже частично «обновили», а ядро — нет.

**Три параллельные вселенные (корневой диагноз):**

| Вселенная | Что это | Где живёт |
|-----------|---------|-----------|
| A. Legacy section-engine | `wedding-luxury` manifest + `InvitationLayoutRouter` + CSS-орнаменты | визард-превью, публичная страница без `canvas`, demo |
| B. Canvas-engine | `CanvasDocument` + `CanvasEditor` / `CanvasRenderer` | `/invitations/[id]/canvas`, публичка **если** `canvas != null` |
| C. Tariff ladder 2023–25 | free / standard / premium / agency + watermark + guest_ops gates | entitlements, checkout, GuestOpsHub, API guards |

Бриф и pricing-страница говорят: **«заплатил цену шаблона → полный доступ»**.  
Движок и пост-публикация всё ещё говорят: **«бесплатно с водяным знаком, guest ops после Стандарта, своя ссылка после Премиум»**.

Пока A/B/C не сведены к **одному пути данных и одной модели оплаты**, любой «фикс кнопки» будет косметикой.

**Ограничение этой сессии:** `node_modules` отсутствуют, `pnpm dev` не поднимался. Флоу пройден **по коду end-to-end** (entry → wizard → preview → checkout → post-publish → public → canvas). Визуальные скриншоты не снимались; золотые углы подтверждены по CSS/asset-путям.

---

## 1. Карта пользовательского флоу (как есть)

```
Лендинг / templates
  → /create?template=…  (QuickWizard)
      → step 1–6 (тип, имена, дата, место, фото, colorScheme)
      → step 7 PREVIEW:
           InvitationLayoutRouter + wedding-luxury sections
           + PreviewWatermark
           + CTA «Оплатить {DEFAULT 3990}»
           + secondary «Настроить в конструкторе»
      → Publish:
           syncDraftToServer (legacy fields only, NO canvas)
           checkoutInvitationClient(id)  // intent DEFAULT = 'publish'
           → freemium publish (watermark) OR redirect paymentUrl
           → /invitations/[id]?published=1
                → GuestOpsHub + PostPublishShareScreen
                   (locked guest ops / Standard / Premium upsell)
      → Constructor:
           /invitations/[id]/canvas
           if inv.canvas null → convertLegacyToCanvas(...)  // ignores templateKey
           simple: CanvasRenderer(guest)
           edit: full CanvasEditor (swap component)
           PATCH canvas: BLOCKED if planSku === 'free'
Public /i/[slug]:
  if canvas exists → CanvasGuestPage
  else → GuestInvitationPage (legacy LayoutRouter)
```

**Вывод:** пользователь **ни разу** не видит один и тот же «документ приглашения» на всём пути. Меняются движок, layout, дефолтные имена, украшения, цена и набор «разрешённых» фич.

---

## 2. P0 — блокеры запуска (чинить первыми)

### P0-1. Кнопка «Оплатить» в визарде **не ведёт в оплату**

**Симптом владельца (следствие):** «после опубликовать шаблон/состояние магически другое», «неюзабельно», ощущение обмана.

**Факт в коде:**

- UI визарда: `quickWizard.payToPublish` / `checkoutMessage` — «оплатите {price} ₸».  
  Файл: `apps/web/src/components/quick-wizard/QuickWizard.tsx` (~L286–330), i18n `kz.ts` / `ru.ts` (`quickWizard.*`).
- Цена на кнопке: **хардкод** `DEFAULT_PUBLICATION_PRICE_KZT` (= `PLAN_CATALOG.standard` = 3990), **не** `Template.priceKzt` из БД.  
  `QuickWizard.tsx` L33, L291, L307, L328.
- Вызов оплаты: `checkoutInvitationClient(invitationId)` **без** `{ intent: 'pay' }`.  
  `QuickWizard.tsx` `handlePublish` ~L203–230.
- Клиент по умолчанию: `intent: 'publish'`.  
  `apps/web/src/lib/payments/checkout-client.ts` L28–41.
- Сервер при `intent === 'publish'`: **публикует freemium**, `paymentUrl: null`, `needsPayment: unpaid`, watermark остаётся.  
  `apps/web/src/lib/payments/checkout.ts` L171–184.
- Дальше визард: `if (checkout.published && checkout.publicUrl) → ?published=1`.  
  То есть «Оплатить» часто = **бесплатная публикация с водяным знаком**, без Kaspi.

**Почему это P0:** копирайт врёт. Пользователь думает, что купил шаблон. Система дала freemium + потом запирает guest ops за «Стандарт».

**Связанная ложь:** `canPublishWithoutPayment()` → `true` (`publish-watermark.ts` L21–23) + комментарий «Freemium: publish is free». Это **прямо противоположно** модели владельца («разовая оплата за одно приглашение = полный доступ»).

---

### P0-2. Два движка рендера → «шаблон меняется магически»

**Симптом владельца:**  
> «В предпросмотре вижу этот шаблон. После опубликовать — абсолютно другой.»

**Цепочка потери identity:**

| Шаг | Рендерер | Источник дизайна |
|-----|----------|------------------|
| Визард preview | `InvitationLayoutRouter` → `SectionRenderer` + `wedding-luxury` manifest | `templateKey`, assets, CSS corners |
| Сохранение draft | POST `/api/invitations` | `templateKey`, `templateData`, `customText` — **canvas = null** |
| Publish (типичный) | public legacy path | тот же section-engine |
| «Конструктор» / edit | `convertLegacyToCanvas` если `canvas` null | **фиксированный** бордо-золото layout, **без** `templateKey` |
| Public после save canvas | `CanvasGuestPage` | canvas-doc, **не** manifest |

Ключевые файлы:

- Preview: `QuickWizard.tsx` L302–314 → `InvitationLayoutRouter`.
- Canvas page: `apps/web/src/app/invitations/[id]/canvas/page.tsx` L30–48 — `convertLegacyToCanvas` **не получает** `templateKey`.
- Converter: `apps/web/src/lib/canvas/legacy-converter.ts` — hardcoded `LUXURY_*`, `dividerEl`, couple-names defaults.
- Public switch: `apps/web/src/app/i/[slug]/public-invitation-client.tsx` L57–77, L152–159 — `canvas ? canvas : legacy`.
- Public canvas API: `apps/web/src/app/api/invitations/public/[slug]/canvas/route.ts` — возвращает `canvas: null` для legacy.

**Дополнительный удар по «магии» — имена:**

- Визард кладёт строку имён в `customText.greeting` (`formToDraft`, QuickWizard L71–74).  
  **Не** пишет `groomName` / `brideName`.
- Converter читает `ct.groomName || ct.firstName || 'Айбек'` и `brideName || 'Айдана'`  
  (`legacy-converter.ts` L157–158).  
  → в canvas-предпросмотре/редакторе пользователь видит **чужие дефолтные имена**, даже если ввёл свои.

**colorScheme step 6 — мёртвый UI:**

- Схема есть в форме (`quick-wizard-schema.ts` L45, QuickWizard L528–560).
- `formToDraft` **не сохраняет** `colorScheme` ни в `templateData`, ни куда-либо ещё.
- Пользователь «выбирает оформление» → выбор исчезает бесследно.

**Каталог реально один шаблон:**  
`apps/web/src/lib/templates/catalog.ts` — только `wedding-luxury`.  
Все legacy keys (`classic`, `elegant`, …) мапятся туда же (`legacy.ts`).  
«Выбор шаблона» на сайте почти фикция; «выбор цвета» — тоже.

**Вопрос следующему агенту (не решать в одиночку без владельца):**  
Канон на launch — **section/manifest** или **canvas**?  
Пока оба живы без lossless bridge, «магия шаблона» неизбежна.

---

### P0-3. Золотые элементы «по углам» в предпросмотре

**Симптом владельца:**  
> «После опросника в предпросмотре по краям 4 золотые хуйнюшки по углам.»

**Аудит-документ указывал на `dividerEl` в converter.** Это **частично неточно** для визард-превью:

Визард-превью **не** идёт через `convertLegacyToCanvas`. Он рендерит **legacy section-engine**.

**Реальные источники 4 углов:**

1. **Cover photo ornate corners** (жёстко wedding-luxury PNG):  
   `apps/web/src/components/invitation-layouts/sections/CoverPhotoSection.tsx` L6–11, L38–49  
   — `corner-01…04.png` на 4 углах рамки фото.

2. **Page backdrop corners** из manifest assets:  
   `TemplateBackdrop.tsx` L21–26, L61–69  
   + `wedding-luxury.ts` assets `cornerTl/Tr/Bl/Br`  
   + CSS `.layer-canvas__corner--tl/tr/bl/br` в `apps/web/src/styles/invitation.css` (~L621+, ~L1454+).

3. **В canvas-пути** (если открыли конструктор / после конвертации):  
   `legacy-converter.ts` — **не** 4 угла, а **горизонтальные** `dividerEl` цвета `#c9a961` (L94–108, L180, L212) + весь бордо-золотой «придумай красиво» layout.  
   Владелец мог видеть и это, если смотрел canvas simple mode.

**Почему так вышло:** агенты «украсили» шаблон и converter, не спросив, нужен ли ornated chrome в wizard preview и должен ли converter **изобретать** дизайн.

**Продуктовый критерий владельца:**  
предпросмотр = то, что будет после публикации, **без выдуманного мусора**.  
Сейчас preview = marketing-decorated template demo, не «твой чистый результат».

---

### P0-4. Редактор — не «один редактор с hidden panels»

**Симптом владельца:**  
> «При предпросмотре — наш редактор, не имитация. Edit — БЕЗ редиректов и часовых загрузок — раскрывается полный редактор.»

**Факт:**

- `CanvasEditorClient.tsx`: два **разных дерева**:
  - `!isEditing` → header + `CanvasRenderer mode="guest"` + footer «Редактировать»
  - `isEditing` → **другой** root + полный `CanvasEditor`
- Это **unmount/mount**, не show/hide панелей. Состояние selection/history/zoom между режимами не общее на уровне одного editor shell (doc state в parent есть, UI editor — нет).
- `CanvasEditor` **не имеет** `simpleMode` / `expandedMode` (`CanvasEditor.tsx` props L19–26).
- Переход «Настроить в конструкторе» из визарда = `router.push(/canvas)` после sync — **полная навигация + server render + convertLegacy**. Это как раз «редирект и загрузка», которые владелец запретил как ощущение продукта.
- Кнопка Edit на post-publish hub: `editHref` → `/invitations/[id]/canvas` (`page.tsx` L89) — снова отдельный route, не inline expand.

**Ещё хуже — save canvas запрещён free:**

```98:99:apps/web/src/app/api/invitations/[id]/canvas/route.ts
if (pricing && pricing.entitlements.planSku === 'free' && !session.user.isAdmin) {
  throw new ApiError('plan_required', 'Продвинутый конструктор доступен на тарифе Стандарт и выше', 403);
}
```

- UI пейвол на вход в конструктор убран (brief §2), но **API всё ещё режет free**.
- `CanvasEditorClient.save` глотает ошибки (`catch { ignore }` / `throw save_failed` без UI).  
  Пользователь «редактирует», autosave в `CanvasEditor` показывает saving/saved/error, но PATCH 403 → правки **не персистятся**, публичка остаётся legacy.

Это прямое нарушение: «создание и редактирование бесплатно, плата при публикации».

---

### P0-5. После публикации — мёртвая тарифная матрица (цитата владельца дословно в i18n)

**Симптом владельца:**  
> «Қонақтар тізімі — Жіберу, еске салу… — Стандарттан кейін (3 990 ₸). Какой-то премиум. Какой-то без сервис белгісі. Какой-то өз сілтемесі. Заплатил цену шаблона — полный доступ.»

**Факт — текст 1:1:**

```223:226:apps/web/src/i18n/messages/kz.ts
guestsLockedDesc:
  'Жіберу, еске салу, отбасы, отырғызу, тойханаға тізім және ресторан сілтемесі — Стандарттан кейін ({price} ₸).',
unlockStandard: 'Стандарт — сервис белгісін алу + қонақтар тізімі',
unlockPremium: 'Премиум — + өз сілтемесі',
```

UI:

- `GuestOpsHub.tsx` L374–405 — lock card + `unlock('standard')` / `unlock('premium')`.
- L449–465 — «убрать watermark» → again Standard.
- `PostPublishShareScreen.tsx` L179–208 — CSV/restaurant disabled + `opsLockedHint` про Стандарт.
- Страница `/invitations/[id]` **всегда** рендерит `GuestOpsHub`, не редактор (`page.tsx`).

**Backend gates (plan_required), всё ещё живы:**

| Endpoint / lib | Gate |
|----------------|------|
| `api/invitations/[id]/canvas` PATCH | `planSku === 'free'` |
| `api/invitations/[id]/slug` | `!customSlug` (premium+) |
| `api/invitations/[id]/guests/mark-sent` | `!guestOps` |
| `api/invitations/[id]/guests/export` | plan_required |
| `api/invitations/[id]/remind` | plan_required |
| `lib/guests/seating.ts` | plan_required |
| `lib/restaurant/share-service.ts` | plan_required |
| public watermark | `shouldShowPublishWatermark` ← `entitlements.watermark` |

**Entitlements engine (старая модель):**

- `plan-catalog.ts`: free (watermark), standard 3990 (guest_ops…), premium 4990 (+custom_slug), agency 20000/mo.
- `resolve-entitlements.ts`: free → `watermark: true`, все ops false.
- `apply-plan-unlock.ts`: пишет `unlockedPlanSku` standard|premium|agency.
- `invitation-pricing.ts`: `hasPaidOrder = !entitlements.watermark` — определение «оплачено» = «нет ватермарка», не «полный доступ к продукту как к SKU».

**Pricing UI уже новый** (`PricingPageContent.tsx` — 2 карточки).  
**Продуктовое ядро — старое.** Это классический «сделали витрину, склад не тронули».

**Модель владельца (канон из брифа + цитат):**

1. Обычный: платит `template.priceKzt` **один раз** → **всё** для этого приглашения (no watermark, guest list, export, restaurant, slug?, full edit).
2. Agency: 20 000 ₸/мес → безлимит + курс.

**Открытый продуктовый вопрос (спросить владельца, не угадывать):**  
входит ли `custom_slug` и «priority» в разовую оплату шаблона, или slug — отдельная история?  
В цитате «өз сілтемесі» звучит как «не надо апсейлить премиумом» → скорее **входит**.

---

## 3. P1 — серьёзные разрывы связности (не «баги UI», а отсутствие продукта)

### P1-1. Нет единого document path «ввод → хранение → preview → publish → guest»

Данные размазаны:

- Invitation row: `templateKey`, `templateData`, `customText`, event fields, optional `canvas`, `mobileCanvas`.
- Wizard draft localStorage: `qazshaqyru_wizard_draft` (форма) + `draft-storage` LocalDraft.
- Canvas document: отдельный JSON, **не** синхронизируется обратно в `templateData`/manifest fields.
- Guest page: выбирает engine по наличию canvas blob.

**Итог:** dual-write отсутствует; dual-read с разной семантикой присутствует.  
Любой агент, «починивший только converter» или «только GuestOpsHub», оставит дыру.

### P1-2. `convertLegacyToCanvas` — не конвертер, а генератор чужого шаблона

Файл: `legacy-converter.ts`.

Что делает плохо:

- Игнорирует `templateKey` / manifest / theme.
- Hardcode palette `#6b1d3a` / `#c9a961` / `#fff8f1`.
- Добавляет divider/countdown/button layout «от себя».
- Дефолтные имена Айбек/Айдана.
- Не переносит program, dress code, gallery, envelope, wishes, kaspi, map block как в manifest.
- Комментарий в файле честно врёт себе: «approximate wedding-luxury closely» — на деле vertical stack без ornaments/sections.

**Правильная роль converter (если canvas = канон):**  
instantiate from **template canvas blueprint** (admin builder) + fill placeholders from wizard data.  
Не «нарисовать красиво».

**Если section-engine = канон на launch:**  
converter не должен вызываться в user path вообще; canvas — later.

### P1-3. Три (четыре) редактора в репо

| Слой | Путь | Статус |
|------|------|--------|
| Canvas | `components/canvas/*` (~33 files) | «новый основной» по брифу |
| Live Editor | `components/live-editor/*` (21 files) | route redirect, код мёртвый для UX, висит |
| Old editor shell | `components/editor/*` (~34 files, 7k+ LOC) | GuestOpsHub жив; куча панелей от старого inline editor |
| LayoutRouter edit mode | `invitation-layouts/LayoutRouter.tsx` (900+ LOC) | всё ещё умеет isEditing + EditorToolbar |

Агенты наращивали «ещё один редактор», не убивая предыдущий.  
Владелец чувствует «инфантильную игру» — потому что **нет одного канонического editor UX**.

### P1-4. Post-publish hub ≠ то, что нужно организатору

После «успеха» пользователь попадает в analytics/ops dashboard с:

- badge «Үстел және қонақтар»,
- plan chip free/standard/…,
- watermark chip,
- upsell Standard/Premium,
- edit = уход на другой URL.

Нет:

- спокойного «вот твоя ссылка, вот WhatsApp, вот редактировать приглашение»,
- ощущения «ты купил — всё твоё»,
- единого visual language «продолжения» canvas/wizard.

`PostPublishShareScreen` ближе к нужному, но сразу тащит locked ops и Standard-hint.

### P1-5. Цена шаблона vs ladder price — рассинхрон

- `resolvePublicationPriceKzt(template.priceKzt)` с clamp 2990–4990 — ок как задел.
- Wizard показывает `DEFAULT_PUBLICATION_PRICE_KZT` всегда.
- Checkout `pay` standard берёт `pricing.priceKzt`; premium/agency — catalog.
- Landing i18n всё ещё местами «3 990 ₸» и «Стандарт» в FAQ (`kz.ts` landing.faq.priceAnswer и др.).

Витрина `/pricing` почищена; **остальной продукт продолжает говорить на языке ladder**.

### P1-6. «Опубликовано» при freemium vs «оплачено»

Дашборд/хаб путают:

- `status === 'published'` (есть публичная ссылка),
- `unlockedPlanSku` / `!watermark` (деньги получены),
- `guestOps` (отдельный feature flag).

Владелец мыслит: **оплатил шаблон = published без ограничений**.  
Код мыслит: **publish ⊥ pay ⊥ ops unlock**.

---

## 4. P2 — качество / шум / незакрытый cleanup брифа

Часть брифа `HANDOFF_SITE_CLEANUP_2026-07-29` **сделана** (2 cards pricing, CTA → `/create`, edit redirect, agency 20k в catalog, simple/full canvas shell).  
Часть **не сделана или сделана вполсилы**:

| Пункт брифа | Состояние |
|-------------|-----------|
| Pricing 2 cards | ✅ UI |
| Entitlements sync to new model | ❌ engine + GuestOpsHub + API |
| Canvas без пейвола | ⚠️ UI open, API closed |
| Simple/full editor | ⚠️ component swap, not panels |
| Убрать Standard/Premium из editor upsell | ❌ |
| LogoMark убрать | ❌ dashboard empty, public floating btn, error/404, mock-pay |
| Live editor delete | ⚠️ redirect only, code remains |
| Dead landing components | не аудировалось построчно в этой сессии |
| Единый дизайн dashboard/admin | не проверялся визуально |

Другой шум:

- `ManagedOrderForm` файл жив (публичный вход — проверить templates; бриф хотел убрать).
- i18n `templatesPage.managed*`, `designerNote*`, `waitlist*` — ключи живы.
- `LogoMark` — владелец не любит; всё ещё в product surfaces.
- Тесты закрепляют **старую** ladder-модель (`plan-ladder`, `pricing-integrity`, checkout integration) — следующий агент сломает сотни asserts, если наивно выпилит SKU. Это не аргумент «оставить дерьмо», это аргумент **планировать миграцию**, а не «чтобы тесты зелёные».

---

## 5. Матрица «владелец хочет» vs «код делает»

| Требование владельца | Код сейчас | Вердикт |
|----------------------|------------|---------|
| Разовая оплата = цена шаблона | Ladder free/standard/premium + freemium publish | FAIL |
| Полный доступ после оплаты, без premium upsell | GuestOpsHub + API gates | FAIL |
| Без watermark после оплаты шаблона | watermark снимается на standard unlock — но publish path freemium | PARTIAL/FAIL |
| Preview = то же, что publish | dual engine + converter invents design | FAIL |
| Один редактор, expand without redirect | CanvasRenderer ↔ CanvasEditor swap; routes | FAIL |
| Edit free | canvas PATCH plan_required free | FAIL |
| Не придумывать украшения | corners + dividerEl + luxury defaults | FAIL |
| Связный продукт, не набор страниц | 3 engines + dead editors + stale copy | FAIL |
| Pricing 2 cards | PricingPageContent | OK (витрина) |
| Agency 20k | plan-catalog agency | OK (число) |

---

## 6. Конкретный backlog для следующего агента (порядок мысли, не «сразу пили»)

> Владелец: лучше часы анализа, чем ещё одно «через жопу».  
> Перед кодом — **зафиксировать канон** (короткие вопросы владельцу, если неясно).

### Шаг 0 — продуктовые решения (обязательно до большого рефактора)

1. **Канон рендера на launch:** canvas-only / sections-only / sections now + canvas later?  
2. **Оплата:** убрать freemium publish полностью? (кнопка = всегда `intent: 'pay'`, без публичной ссылки до paid)  
3. **После pay template:** какие флаги true? Предложение по цитатам:  
   `watermark=false`, `guestOps=true`, `funnel/reminders/seating/household/csv/restaurant=true`, `customSlug=true`.  
   Agency отдельно.  
4. **Нужен ли public watermark вообще** как режим, или unpaid draft только private?

### Шаг 1 — один путь оплаты (P0-1, P0-5)

- Wizard + любой Publish CTA → `intent: 'pay'`, amount = `getInvitationPricing.priceKzt`.
- Убрать/не использовать freemium publish в user-facing CTA (или спрятать, если владелец явно оставит).
- `applyPlanUnlock`: paid template order → **full invitation entitlements**, не «standard subset» если модель «всё».
- GuestOpsHub: удалить Standard/Premium upsell UI; показать ops.
- i18n: вычистить guestsLocked / unlockPremium / freePublishNote / opsLockedHint про Стандарт.
- API guards: после paid invitation — пропускать ops; free draft — как скажет владелец (скорее ops only after pay, edit always).

### Шаг 2 — один путь документа (P0-2, P0-3, P1-1, P1-2)

**Если canvas канон:**

- При создании из шаблона: копировать **template.canvas blueprint** (admin), не `convertLegacyToCanvas` fantasy.
- Wizard preview = `CanvasRenderer` того же document (simple mode), не LayoutRouter.
- Placeholders: names/date/place/photo из wizard → elements by `placeholderKey`.
- `convertLegacyToCanvas` — только migration tool для старых rows, не runtime UX path.
- Public: только canvas path для новых invites.

**Если sections канон на launch:**

- Не гонять пользователей в canvas.
- Edit = section/live editor one shell.
- Canvas оставить admin template builder only.
- Убрать dual public switch для new invites.

### Шаг 3 — editor UX (P0-4)

- Один `CanvasEditor` (или sections editor) с `chrome="minimal" | "full"`.
- Minimal: canvas + Save + Publish + Edit.
- Full: те же stage + palette/inspector/toolbar; CSS/hidden, **без** route change.
- Убрать plan gate с PATCH canvas для editing-free model.
- Не глотать save errors.

### Шаг 4 — вычистить зоопарк

Файлы/зоны (не полный список, якоря):

```
apps/web/src/lib/entitlements/plan-catalog.ts
apps/web/src/lib/entitlements/resolve-entitlements.ts
apps/web/src/lib/invitations/invitation-pricing.ts
apps/web/src/lib/invitations/publish-watermark.ts
apps/web/src/lib/payments/checkout.ts
apps/web/src/lib/payments/checkout-client.ts
apps/web/src/lib/payments/apply-plan-unlock.ts
apps/web/src/lib/canvas/legacy-converter.ts
apps/web/src/app/invitations/[id]/canvas/page.tsx
apps/web/src/app/invitations/[id]/canvas/CanvasEditorClient.tsx
apps/web/src/app/api/invitations/[id]/canvas/route.ts
apps/web/src/components/quick-wizard/QuickWizard.tsx
apps/web/src/components/editor/GuestOpsHub.tsx
apps/web/src/components/editor/PostPublishShareScreen.tsx
apps/web/src/app/i/[slug]/public-invitation-client.tsx
apps/web/src/components/invitation-layouts/sections/CoverPhotoSection.tsx
apps/web/src/components/invitation-layouts/sections/TemplateBackdrop.tsx
apps/web/src/i18n/messages/kz.ts
apps/web/src/i18n/messages/ru.ts
+ все API * plan_required
+ tests plan-ladder / checkout / watermark
```

Dead candidates after path lock: `components/live-editor/*`, большая часть old `components/editor/*` panels, dual LayoutRouter edit.

### Шаг 5 — Definition of Done (продуктовый, не tsc)

Пройти руками:

1. Templates → create wizard → preview **выглядит как** будущий guest page.  
2. Pay (mock) → деньги → guest page **тот же** design, **без** watermark.  
3. Post-pay hub: ссылка, WhatsApp, QR, **гости/export/restaurant доступны**, нет Standard/Premium.  
4. Edit: expand editor without full reload drama; save works unpaid (draft) and paid.  
5. Имена/дата/место/фото пользователя **нигде** не заменяются на Айбек/Айдана или чужой layout.  
6. Нет 4 «золотых углов», которых владелец не просил (или они часть купленного шаблона и видны **одинаково** preview=publish — тогда это design template, не converter garbage).  
7. `/pricing` copy = engine behavior = post-publish copy.

`tsc` / vitest / build — необходимое, **недостаточное** условие. Зелёные тесты при freemium+ladder сейчас **фиксируют неправильную модель**.

---

## 7. Что в исходном audit-доке было верно / неточно

| Утверждение audit-дока | Вердикт |
|------------------------|---------|
| Converter invents gold junk | Верно для canvas path; **углы в wizard preview** — CoverPhoto + TemplateBackdrop, не dividerEl |
| templateKey ignored in convertLegacyToCanvas | Верно |
| Preview ≠ publish | Верно (глубже: dual engine) |
| Editor = swap not panels | Верно |
| GuestOpsHub old SKUs | Верно, + i18n exact owner quote |
| Entitlements zoo | Верно |
| Agents don't doubt | Верно; cleanup brief closed UI, left core |

Дополнительно найдено **вне** исходного списка (критично):

1. Wizard «Pay» → default `intent: 'publish'` freemium (**обман CTA**).  
2. Canvas PATCH locked for free (**edit not free**).  
3. Names mapping wizard → converter broken (Айбек/Айдана).  
4. `colorScheme` step discarded.  
5. Hardcoded 3990 in wizard vs template price.  
6. Public page engine switch by canvas nullability.

---

## 8. Цитаты владельца (канон для следующего агента)

> «Вы не отличаете просто не ломающееся плохое дерьмо от качественно сделанных вещей.»

> «Вам лишь бы главное сделано и работает (хоть через жопу).»

> «Сейчас сервис не готов к запуску и к реальным людям, потому что это попросту НЕ ЮЗАБЕЛЬНО.»

> «Клиенты заплатят цену шаблона и должны к нему иметь полный доступ, без вотермарков, без премиумов и сразу возможностью редачить всё.»

> «При предпросмотре будет наш редактор, не его имитация… При Edit — БЕЗ РЕДИРЕКТОВ И ЧАСОВЫХ ЗАГРУЗОК — раскрывается полноценный редактор.»

> «Лучше часы анализа, чем ещё одно „сделано через жопу“.»

---

## 9. Сообщение следующему агенту

Не начинай с «быстрого фикса углов» или «подкрутить CSS».  
Корневая болезнь — **отсутствие единого product path** (document + money + entitlements + editor chrome).

Если сделаешь только:

- убрать 4 PNG corners, **или**
- поменять тексты GuestOpsHub, **или**
- добавить `simpleMode` prop,

…владелец снова будет прав: «технически работает, продукта нет».

**Минимальный честный scope к запуску:**

1. Одна модель денег (pay template = full invite access; agency separate).  
2. Один renderer path preview=publish=guest.  
3. Один editor shell minimal/full.  
4. Выжечь ladder upsell из user journey.  
5. Переписать/убить тесты, которые цементируют freemium+standard/premium.

Сомневайся в уже «зелёном».  
Спрашивай владельца, когда канон неочевиден.  
Не добавляй новый маркетинг и новые сущности «на всякий случай».

---

*Конец диагноза. Код не изменялся (кроме создания этого файла). Следующий шаг — plan/fix только после прочтения §§0–9.*
