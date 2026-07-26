# ТЗ: исправление визуальных дефектов QazShaqyru

**Дата аудита:** 2026-07-10  
**Роль автора:** Principal Visual Gatekeeper (только аудит, без массовых фиксов)  
**Аудитория:** агент-исполнитель на свежем контексте  
**База проверки:** `http://127.0.0.1:3000` (локальный `pnpm dev`, mock OTP/payment)

---

## 1. Цель

Устранить визуальные и UX-регрессии MVP сервиса цифровых приглашений: лендинг, каталог, Quick Edit, редактор, публичные/demo-страницы, family preview, модалки.

**Критерий готовности:** каждый пункт ниже верифицирован скриншотом «до/после» по матрице в §6.

---

## 2. Артефакты (доказательства)

### Папки скриншотов

| Папка | Описание |
|-------|----------|
| `apps/web/docs/visual-audit/2026-07-03/` | Базовый прогон Playwright (лендинг, каталог, login, 404, blog, terms) |
| `apps/web/docs/visual-audit/2026-07-10/` | Расширенный аудит: demo, editor, dashboard, clips, KZ, modal, family preview |

### Ключевые screen_id

| screen_id | Файл |
|-----------|------|
| `landing-mobile-ru` | `2026-07-03/landing-mobile-ru.png` |
| `landing-hero-wait-m390-ru` | `2026-07-10/landing-hero-wait-m390-ru.png` |
| `landing-how-section-m390-ru` | `2026-07-10/landing-how-section-m390-ru.png` |
| `landing-reduced-motion-m390-ru` | `2026-07-10/landing-reduced-motion-m390-ru.png` |
| `templates-mobile-ru` | `2026-07-03/templates-mobile-ru.png` |
| `modal-template-preview-desktop-ru` | `2026-07-10/modal-template-preview-desktop-ru.png` (ДО фикса) |
| `modal-template-preview-fixed-desktop-ru` | `2026-07-10/modal-template-preview-fixed-desktop-ru.png` (ПОСЛЕ фикса iframe) |
| `demo-wedding-luxury-m390-ru` | `2026-07-10/demo-wedding-luxury-m390-ru.png` |
| `demo-wedding-luxury-m390-kz` | `2026-07-10/demo-wedding-luxury-m390-kz.png` |
| `quick-edit-pay-cta-clip-m390-ru` | `2026-07-10/quick-edit-pay-cta-clip-m390-ru.png` |
| `draft-editor-m390-ru` | `2026-07-10/draft-editor-m390-ru.png` |
| `draft-editor-cover-region-m390-ru` | `2026-07-10/draft-editor-cover-region-m390-ru.png` |
| `family-preview-m390-ru` | `2026-07-10/family-preview-m390-ru.png` (404!) |
| `settings-m390-ru` | `2026-07-10/settings-m390-ru.png` |
| `dashboard-m390-ru` | `2026-07-10/dashboard-m390-ru.png` |

### Скрипты для воспроизведения

- `apps/web/e2e/visual-audit.spec.ts` — устарел (см. §7)
- `apps/web/scripts/capture-audit-extra.mjs`
- `apps/web/scripts/capture-audit-phase2.mjs`
- `apps/web/scripts/capture-audit-phase3.mjs`
- `apps/web/scripts/diag-map-btn.mjs` — диагностика кнопки карты
- `apps/web/scripts/diag-iframe-embed.mjs` — диагностика iframe

---

## 3. Уже сделано в working tree (проверить, не дублировать)

> Аудитор внёс точечные фиксы до запрета «не чини». Исполнитель: **верифицировать** и при необходимости доработать.

### FIX-A: Кнопка «Открыть на карте» — невидимый текст

- **Файл:** `apps/web/src/styles/invitation.css`
- **Root cause:** `.inv-map-link a { color: var(--inv-accent) }` перебивал `.inv-manifest-map-btn { color: #fffaf0 }` (текст и фон = `rgb(138,115,68)`).
- **Сделано:** селектор `.inv-map-link a.inv-manifest-map-btn { color: #fffaf0 }`
- **Верификация:** `node scripts/diag-map-btn.mjs` → `color: rgb(255, 250, 240)`

### FIX-B: Модалка «Превью» в каталоге — пустой iframe

- **Файлы:** `apps/web/src/middleware.ts`, `apps/web/next.config.js`
- **Root cause:** `X-Frame-Options: DENY` (middleware + next.config); console: `Refused to display... in a frame`
- **Сделано:** для `/i/*?embed=1` → `SAMEORIGIN`; DENY убран из глобальных headers в `next.config.js`
- **Верификация:** `node scripts/diag-iframe-embed.mjs` → modal iframe body > 0 chars; скрин `modal-template-preview-fixed-desktop-ru.png`

---

## 4. Critical — исправить в первую очередь

### C-01. Family preview ссылка ведёт на 404

| Поле | Значение |
|------|----------|
| **Evidence** | `family-preview-m390-ru` — страница 404 |
| **Observation** | POST `/api/invitations/{id}/family-preview` возвращает URL `/i/{slug}?preview=TOKEN`, но SSR `apps/web/src/app/i/[slug]/page.tsx` читает только `family`, не `preview`. Guard: `if (!family && status !== 'published') notFound()` |
| **Impact** | Функция «ссылка для семьи до оплаты» полностью сломана |
| **Fix** | В `page.tsx`: читать `preview` из searchParams; передавать в `familyToken` или отдельный prop; не вызывать `notFound()` при валидном preview-токене (логика как в `api/invitations/public/[slug]/route.ts` + `verifyPreviewToken`) |
| **Файлы** | `apps/web/src/app/i/[slug]/page.tsx`, возможно `public-invitation-client.tsx`, `LayoutRouter.tsx` |
| **Confidence** | high |

### C-02. Quick Edit — текст под CTA оплаты обрезан viewport

| Поле | Значение |
|------|----------|
| **Evidence** | `quick-edit-pay-cta-clip-m390-ru` |
| **Observation** | Bottom sheet: кнопка «Оплатить публикацию 3 990 ₸»; строка «Оплатите публикацию… чтобы получить ссылку» срезана снизу |
| **Impact** | Пользователь не видит условия перед оплатой |
| **Fix** | `pb-safe`, `max-h-[85dvh] overflow-y-auto` на sheet; legal copy над кнопкой; проверить `PublishStepper` / pay panel в `QuickEditPage.tsx` |
| **Файлы** | `apps/web/src/components/quick-edit/QuickEditPage.tsx`, guest sheet styles |
| **Confidence** | high |

### C-03. Music sheet блокирует открытие конверта

| Поле | Значение |
|------|----------|
| **Evidence** | Playwright: `guest-music-sheet-backdrop intercepts pointer events` при клике «Открыть приглашение» |
| **Observation** | `LayoutRouter.tsx` рендерит `GuestBottomSheet` с backdrop одновременно с `GuestEnvelopeIntro` |
| **Impact** | Первый тап уходит в sheet, не в конверт — friction на demo/preview/modal |
| **Fix** | Показывать music prompt **после** `envelope-open`; или non-modal banner; `pointer-events: none` на backdrop до open |
| **Файлы** | `apps/web/src/components/invitation-layouts/LayoutRouter.tsx`, `GuestBottomSheet` |
| **Confidence** | high |

---

## 5. High

### H-01. Лендинг — секции пустые при full-page / reduced-motion

| Поле | Значение |
|------|----------|
| **Evidence** | `landing-mobile-ru`, `landing-reduced-motion-m390-ru` — пустоты; `landing-how-section-m390-ru` — контент есть после scroll |
| **Root cause** | `LandingPage.tsx`: `initial={{ opacity: 0 }}` + `whileInView` на steps/features/testimonials/pricing |
| **Fix** | `initial={false}` или CSS `@media (prefers-reduced-motion: reduce) { opacity: 1 !important }`; не гейтить контент только Motion |
| **Файлы** | `apps/web/src/components/landing/LandingPage.tsx` |
| **Confidence** | high |

### H-02. Hero лендинга — floating badge перекрывает CTA на карточке

| Поле | Значение |
|------|----------|
| **Evidence** | `landing-hero-wait-m390-ru` — пузырь «Пожелание Бақытты болыңдар!» на кнопке RSVP |
| **Fix** | Reposition badges на mobile; collision detection; уменьшить absolute offsets |
| **Файлы** | `apps/web/src/components/landing/LandingPage.tsx` (InvitationCard floats ~строки 501–544) |
| **Confidence** | high |

### H-03. Каталог — превью шаблона не похоже на приглашение

| Поле | Значение |
|------|----------|
| **Evidence** | `templates-mobile-ru`, `templates-wedding-mobile-ru` — blur/bokeh вместо реального preview |
| **Root cause** | `getTemplatePreviewUrl()` → `hero/hero-01.webp` (абстрактный фон); `preview.jpg` существует но не используется |
| **Fix** | Приоритет `preview.jpg` в `apps/web/src/lib/templates/helpers.ts` или `configs.ts`; обновить asset |
| **Confidence** | high |

### H-04. Каталог — пустые badge-pill под названием шаблона

| Поле | Значение |
|------|----------|
| **Evidence** | `templates-desktop-ru` — два пустых outline-pill |
| **Root cause** | `template-identity.ts`: `mood/composition: 'pending'`, labels = `''` |
| **Fix** | Заполнить labels для `wedding-luxury` или скрывать пустые `Badge` в `TemplateCatalogCard.tsx` |
| **Confidence** | high (код) |

### H-05. Quick Edit — pay CTA выше полей формы

| Поле | Значение |
|------|----------|
| **Evidence** | `quick-edit-full-m390-ru`, `quick-wizard-step1-m390-ru` |
| **Impact** | Давление оплатить до заполнения; cognitive overload |
| **Fix** | Sticky footer с оплатой; форма сверху; или wizard steps без pay на шаге 1 |
| **Файлы** | `QuickEditPage.tsx`, `PublishStepper` |
| **Confidence** | high |

### H-06. Редактор — onboarding tooltip перекрывает toolbar

| Поле | Значение |
|------|----------|
| **Evidence** | `draft-editor-m390-ru` |
| **Root cause** | `EditorToolbar.tsx` — localStorage `qazshaqyru:editor-onboarding` |
| **Fix** | Coach-mark со стрелкой к preview, не modal поверх tabs; позиционирование |
| **Confidence** | high |

### H-07. Редактор — несоответствие stepper и контекста оплаты

| Поле | Значение |
|------|----------|
| **Evidence** | `draft-editor-cover-region-m390-ru` — stepper на шаге 2 «Гости», но header/toolbar требуют оплату (шаг 3) |
| **Fix** | Синхронизировать `PublishStepper` с реальным flow; один источник truth для step index |
| **Файлы** | `EditorLayout.tsx`, `PublishStepper`, `resolvePublishStep` |
| **Confidence** | high |

### H-08. Demo/public KZ — имена в hero обрезаны

| Поле | Значение |
|------|----------|
| **Evidence** | `demo-wedding-luxury-m390-kz` — «Нұрлан & …» обрезано |
| **Fix** | `clamp()` font-size, padding, `overflow` в `.inv-manifest-hero__*` |
| **Файлы** | `invitation.css`, `HeroNamesSection.tsx` |
| **Confidence** | high |

### H-09. RSVP видна до открытия конверта

| Поле | Значение |
|------|----------|
| **Evidence** | `demo-wedding-luxury-m390-ru` — кнопка «Ответить» при «НАЖМИТЕ, ЧТОБЫ ОТКРЫТЬ» |
| **Fix** | Скрывать guest chrome до `GuestEnvelopeIntro` complete |
| **Файлы** | `LayoutRouter.tsx`, sticky RSVP styles |
| **Confidence** | high |

### H-10. Settings — слабый loading state

| Поле | Значение |
|------|----------|
| **Evidence** | `settings-m390-ru` — пустая белая карточка + «Загрузка...», низкий контраст |
| **Fix** | Skeleton с shimmer; центрирование; контрастный текст |
| **Confidence** | high |

### H-11. Каталог desktop — одна карточка, 65% пустоты

| Поле | Значение |
|------|----------|
| **Evidence** | `templates-desktop-ru` |
| **Fix** | Grid `repeat(auto-fill, minmax(280px, 1fr))`; flagship hero row; placeholder «скоро» |
| **Confidence** | high |

### H-12. Demo banner — слабый CTA, перегруженный copy

| Поле | Значение |
|------|----------|
| **Evidence** | `demo-banner-clip-m360-ru` |
| **Fix** | Короче текст; outline CTA с контрастом; симметричные отступы |
| **Файлы** | `public-invitation-client.tsx`, demo banner styles |
| **Confidence** | high |

---

## 6. Medium

### M-01. Footer — дубль бренда «QazShaqyru»

- **Evidence:** login, templates, 404, family-preview 404
- **Root cause:** `ru.ts` → `headerTagline: 'QazShaqyru'` в `SiteCompactFooter.tsx`
- **Fix:** осмысленный tagline

### M-02. Login — разные оттенки зелёного (кнопка vs бордер)

- **Evidence:** `login-mobile-ru`
- **Fix:** единый `--us-accent` на primary

### M-03. Empty search — слабый empty state

- **Evidence:** `templates-search-empty-mobile-ru`
- **Fix:** кнопка «Сбросить», ссылки на категории

### M-04. Календарь/таймер — мелкая типографика, низкий контраст

- **Evidence:** demo screenshots
- **Fix:** `font-size` ≥14px на mobile, контраст WCAG в `invitation.css`

### M-05. Demo banner vs шаблон — визуальный разрыв (тёмно-зелёный SaaS vs warm wedding)

- **Fix:** баннер в палитре шаблона или полупрозрачный overlay

### M-06. Dashboard empty — избыточный whitespace, тесный header

- **Evidence:** `dashboard-m390-ru`, `dashboard-d1024-ru`
- **Fix:** поднять empty block; overflow menu вместо 4 иконок

### M-07. Hero asset `hero-01.webp` выглядит как «битое фото»

- **Evidence:** demo/editor между greeting и calendar
- **Note:** секция может рендериться корректно, но asset — abstract blur. Заменить на реальный скриншот шаблона или явный empty state «Добавьте фото»
- **Файлы:** `public/assets/templates/wedding-luxury/`, `CoverPhotoSection.tsx`

### M-08. Landing hero flaky на первом кадре (Motion)

- **Evidence:** `landing-mobile-ru` пустой vs `landing-hero-wait-m390-ru` ок
- **Fix:** `initial={false}` на hero `motion.div` с `data-testid="hero-product-frame"`

### M-09. Модалка превью — music sheet внутри iframe на desktop

- **Evidence:** `modal-template-preview-fixed-desktop-ru`
- **Fix:** `embed=1` → `hideGuestChrome` / skip music sheet в embed mode

### M-10. Публичный shell — слабый контраст серых ссылок в footer

- **Evidence:** все PublicShell страницы
- **Fix:** проверить `--us-ink-muted` vs фон

---

## 7. Low

### L-01. 404 — кнопки в ряд тесно на 360px → `flex-col` на `<sm`
### L-02. Quick Edit stepper прижат к правому краю → `px-4` в `PublishStepper`
### L-03. Hover-only overlay на карточке шаблона — бесполезно на touch (`TemplateCatalogCard.tsx` line ~68)
### L-04. Landing step cards — цифры «01» слишком крупные, иконки мелкие (`landing-how-section-m390-ru`)
### L-05. Blog desktop — минимальный контент (`blog-d1024-ru`), низкий приоритет

---

## 8. Не проверено / нужен отдельный прогон

| Сценарий | Причина |
|----------|---------|
| Mock payment UI | `/mock-payment?orderId=demo` редиректит без валидного order+session; нужен E2E checkout flow |
| Published invitation с длинными KZ-именами | нет готового slug в seed |
| Editor с заполненной gallery / без mapUrl / без music | нет тестовых данных |
| Family preview (после фикса C-01) | повторить phase3 capture |
| Viewports 768px, 1280px | не снимались |
| Tablet landscape | — |

---

## 9. Рекомендуемый порядок работ

```
1. C-01 Family preview 404          → блокирует семейный flow
2. C-02 Pay sheet clip              → юридический/UX риск
3. C-03 Music sheet vs envelope     → первый контакт с приглашением
4. Проверить FIX-A, FIX-B           → уже в tree
5. H-01 Landing Motion              → первое впечатление
6. H-02 Hero badge collision
7. H-03 + H-04 Catalog preview/badges
8. H-05..H-07 Editor/Quick Edit flow
9. H-08..H-12 Demo/KZ/settings
10. Medium + Low по приоритету продукта
```

---

## 10. Матрица верификации (после фиксов)

| # | Страница | Viewport | Locale | Состояние | Скрин «после» |
|---|----------|----------|--------|-----------|---------------|
| 1 | `/` | 390 | ru | default + reduced-motion | `landing-*-fixed.png` |
| 2 | `/templates` | 390, 1440 | ru | default + modal preview | `modal-*-fixed.png` |
| 3 | `/invitations/quick?template=wedding-luxury` | 390 | ru, kz | default, pay sheet | `quick-edit-*-fixed.png` |
| 4 | `/invitations/new?template=wedding-luxury` | 390 | ru | no onboarding | `draft-editor-*-fixed.png` |
| 5 | `/i/demo?layout=wedding-luxury` | 360-430 | ru, kz | envelope→open, venue map | `demo-*-fixed.png` |
| 6 | `/i/{slug}?preview=TOKEN` | 390 | ru | draft family preview | `family-preview-fixed.png` |
| 7 | `/dashboard`, `/settings` | 390 | ru | empty / loading | `dashboard/settings-fixed.png` |
| 8 | `/mock-payment` | 390 | ru | valid pending order | через E2E checkout |

**Команды:**

```bash
cd apps/web
pnpm dev   # + env из playwright.config.ts webServerEnv
node scripts/capture-audit-phase3.mjs
npx playwright test e2e/visual-audit.spec.ts
```

---

## 11. Обновить visual-audit harness

Файл `apps/web/e2e/visual-audit.spec.ts` **устарел**:

| Было | Стало |
|------|-------|
| `template-quick-wedding-ivory-gold` | `wedding-luxury` |
| `data-testid="quick-wizard"` | `data-testid="quick-edit"` (флагман идёт через `QuickEditPage`) |
| `/invitations/quick?template=wedding-ivory-gold` | `wedding-luxury` |
| AUDIT_DATE `2026-07-03` | динамическая дата или `2026-07-10` |

Добавить тесты:

- family preview (после C-01)
- modal preview iframe not empty
- map button text visible (computed style)
- `prefers-reduced-motion` landing snapshot

---

## 12. Диагностические one-liner (для регрессии)

**Кнопка карты:**
```bash
node scripts/diag-map-btn.mjs
# ожидание: color !== backgroundColor
```

**Iframe превью:**
```bash
node scripts/diag-iframe-embed.mjs
# ожидание: modal iframe chars > 500
```

**Family preview URL:**
```bash
# после OTP login + create invitation + POST family-preview
# GET returned URL → НЕ 404, видно приглашение
```

---

## 13. Ограничения аудита

- Не сравнивали с прод/стейдж конкурентов визуально — только внутренний стандарт premium.
- Часть landing-пустот — артефакт `animations: 'disabled'` в Playwright + `whileInView`; но `prefers-reduced-motion` скрин подтверждает проблему для a11y.
- Два Critical фикса (карта, iframe) уже в working tree — исполнитель обязан прогнать верификацию.

---

*Конец ТЗ. Исполнитель не должен расширять scope без отдельного согласования.*
