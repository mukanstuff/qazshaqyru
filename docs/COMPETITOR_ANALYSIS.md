# COMPETITOR ANALYSIS: Shaqyru24 + toi.com.kz vs QazShaqyru

> **Дата:** 2026-07-05  
> **Репозиторий:** `c:\shaqyru`, приложение `apps/web`  
> **Статус QazShaqyru:** Phase 1–2 done (`wedding-luxury` + `QuickEditPage`)  
> **Тон:** максимально честный. Без самоуспокоения.

---

## 0. TL;DR — правда в лицо

| Область | Shaqyru24 | toi.com.kz | QazShaqyru |
|---------|-----------|------------|-----------|
| Визуал шаблонов | **Сильно лучше нас** | **Сильно лучше нас** | procedural placeholders, 1 шаблон |
| Каталог | **100+** | **79+ HTML + 16 SURET** | **1** |
| KZ типографика | KZ_RomulC, KZOptima, Monumenta | Asylbek Shelley, Ceremonious, Unbounded | generic CSS vars |
| Анимации | 8 Lottie + video | video hero, CSS reveal | CSS only |
| UX создания | form → preview | form → iframe preview | form → preview ✓ (Phase 2) |
| Backend / payments | неизвестно / слабее? | базовый RSVP | **сильнее** (Kaspi, tokens, wishes) |
| Цена | ~4900 ₸ | 2990–4990 ₸ | 3990 ₸ |

**Вывод:** по продукту, который видит гость и организатор при создании — **мы объективно хуже**. Backend у нас потенциально лучше, но **это не продаёт**, пока визуал и каталог проигрывают.

**Главный миф, который надо убить:** приглашения у них **не** «нарисованы картинкой целиком». Текст — живой HTML. Картинки — декор, рамки, фоны, video, Lottie. Пользователь меняет текст через форму.

---

## 1. Исследованные URL и артефакты

### 1.1 Shaqyru24

| URL | Назначение |
|-----|------------|
| [Demo wedding c196b73b](https://www.shaqyru24.kz/view?builder_page_id=c196b73b-7c96-447d-b6c9-26986906f24c&site_id=370&status=demo) | Эталон wedding KZ (site 370) |
| [Demo 5b78d64a](https://www.shaqyru24.kz/view?builder_page_id=5b78d64a-665e-41fe-8973-036a63df6172&site_id=85790&status=demo) | Предыдущий reverse-engineering |
| [Quick-edit](https://www.shaqyru24.kz/kz/quick-edit?page_id=c196b73b-7c96-447d-b6c9-26986906f24c&site_id=370) | Форма редактирования |

**Файлы в репо (скачаны / сохранены):**

| Файл | Содержимое |
|------|------------|
| `temp_shaqyru24_wedding370.html` | Full view HTML + `__NEXT_DATA__` (2.2 MB) |
| `temp_shaqyru24_v2.html` | Demo 5b78d64a |
| `temp_shaqyru24_quickedit370.html` | Quick-edit shell (данные client-side API) |
| `scripts/shaqyru24_v2_inventory.md` | Inventory 52 компонентов demo 5b78d64a |
| `scripts/analysis_temp_shaqyru24_v2.html.json` | pageProps JSON (486k+ строк) |
| `scripts/parse_shaqyru24_full.py` | Парсер `__NEXT_DATA__` |

### 1.2 toi.com.kz (Тойға Шақыру)

| URL | Назначение |
|-----|------------|
| [Editor uzatu/template23](https://toi.com.kz/invite/new-live?template=uzatu%2Ftemplate23.html) | Live editor + preview |
| [Каталог](https://toi.com.kz/ru/templates) | 79+ шаблонов по категориям |
| [FAQ / pricing](https://toi.com.kz/kk/faq) | 2990 / 4990 ₸, free tier с watermark |

**Файлы в репо:**

| Файл | Содержимое |
|------|------------|
| `temp_toi_index.js` | Main bundle (~941 KB) — catalog 118 HTML templates |
| `temp_toi_template23.js` | **Полный HTML+CSS шаблона** uzatu/template23 (~23 KB) |
| `scripts/extract_toi_templates.py` | Extractor catalog из JS |
| `scripts/analyze_competitors.py` | Shaqyru24 component analyzer |

---

## 2. Shaqyru24 — как устроено приглашение

### 2.1 Платформа: Tyrasoft Page Builder

Shaqyru24 — **white-label** над Tyrasoft (`tyrasoft.kz/uploads/...`). Модель данных:

```
builderPageData
└── blocks[0]  (type: container, height: 5700px)
    └── components[53]  — каждый с position {x, y, z}, size, style, data
```

**Это canvas builder для дизайнеров**, не для пользователя. Пользователь видит **quick-edit форму** → значения подставляются в text-слоты.

### 2.2 Wedding c196b73b — inventory компонентов

```
types: {
  image: 17,      // ALL isPhoto=false → декор, НЕ фото пользователя
  lottie: 8,      // анимации
  text: 12,       // живой текст
  shape: 8,       // геометрия
  video: 1,
  audio-fixed: 1,
  calendar: 1,
  timer: 1,
  button: 1,      // «Картаны ашу» → map
  form2: 1,       // RSVP
  fixed-wishes: 1,
  wishes-list: 1,
}
```

**photo images: 0** — cover пользователя в этом demo не как отдельный isPhoto layer (может быть в других шаблонах).

### 2.3 Текстовые блоки (реальный HTML, не baked-in)

Из `c196b73b` (KZ wedding):

| # | y/z | Содержимое | Роль |
|---|-----|------------|------|
| T6 | | ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ | Hero headline |
| T7–T8 | | Самат / Динара | Имена (4 слота в layout) |
| T5 | | Body: «Сіз(дер)ді ұлымыз … үйлену тойына…» | Основной текст |
| T3 | | «Тойға келуіңізді растауыңызды сұраймыз» | RSVP intro |
| T4 | | «Құрметпен, той иелері:» | Hosts line |
| T0–T1 | | Алматы / ресторан «Абиба» | Venue |
| T9 | | «той уакыты:» | Time label |
| T10 | | «Ізгі тілектер:» | Wishes label |

**Шрифты:** `KZ_RomulC`, `KZOptima`, `KZPFMonumentaPro-Regular`.

### 2.4 Виджеты

- **Calendar:** heart marker, KZ weekdays, custom fonts, event date highlight
- **Timer:** days/hours/minutes/seconds, KZ labels, `Asia/Almaty`
- **RSVP form2:** поле «Есіміңіз», required
- **Wishes:** fixed button + auto-scroll list (interval 3000ms)
- **Audio:** MP3 + styled button «Әуен қосу»
- **Map button:** styled CTA, opens URL

### 2.5 Quick-edit редактор

- Route: `/[lang]/quick-edit?page_id=...&site_id=...`
- SSR HTML содержит только `{ serverLang: "kz" }` — **данные формы и page JSON грузятся client-side**
- UX: форма полей слева/сверху, preview справа/снизу (mobile: preview sticky top)
- Пользователь **не видит** canvas, x/y/z, layers

### 2.6 Что у них объективно круто

1. **Плотность визуала** — 17 decor images + 8 Lottie на один scroll. Выглядит «дорого».
2. **KZ-native typography** — не Google Fonts fallback, а кастомные cuts.
3. **Масштаб каталога** — 100+ шаблонов, разные стили.
4. **Зрелость time-to-wow** — demo сразу impresses на mobile 390px.

### 2.7 Что у них объективно тяжело / нам не нужно копировать 1:1

1. **53 слоя с x/y/z** — каждый новый шаблон = дизайнер в Tyrasoft. Без партнёрства Tyrasoft это **12–18 мес.** своего builder.
2. **8 Lottie** — perf cost, bundle size, сложность поддержки.
3. **5700px absolute container** — не responsive-first, mobile через scale/overflow tricks.

---

## 3. toi.com.kz — как устроено приглашение

### 3.1 Две модели шаблонов

#### A) HTML Scroll Templates (118 штук)

Каждый шаблон = **отдельный HTML+CSS файл**, bundled as JS chunk:

```
import("./template23-Bb-jGW7j.js")  →  export default `<!doctype html>...`
```

Категории: `wedding/`, `uzatu/`, `besik/`, `sundet/`, `merey/`, `tusau/`, `as/` …

#### B) SURET Image Templates (16 штук)

Один `background.webp` + **text slots** с `% top`, font, color, size:

```javascript
{
  id: "suret/uzatu-01",
  tier: "SURET",
  background: "/image-templates/uzatu-01/bg.webp",
  texts: [
    { id: "greeting", defaultText: { kk: "...", ru: "..." }, top: 30, font: "Montserrat", ... },
    { id: "names", defaultText: { kk: "Аружан & Нұрлан" }, top: 42, ... },
  ]
}
```

Ближе к «дизайн на картинке», но текст всё равно **HTML overlay**, не raster.

### 3.2 uzatu/template23 — полная структура (скачан из prod)

**Файл:** `temp_toi_template23.js`  
**Design:** «Uzatu Saukele Cream» — watercolor saukele bride, rose frames, gold confetti.

| Секция | `data-block` | Декор (images/video) | Редактируемые поля (`data-edit-id`) |
|--------|--------------|----------------------|-------------------------------------|
| Hero | hero | **hero.webm** video + poster | `hero-name`, `hero-subline` |
| Greeting | intro | frame-greeting.webp | `invite-title`, `invite-text`, `owners-title`, `owners-name` |
| Countdown | countdown | countdown-bg.webp + confetti×2 | `data-bind="countdown.*"` |
| Date/Location | location | frame-date.webp + divider-rose | `date-eyebrow`, `location-lines`, `map-label` + `data-bind="date"` |
| Dress code | dress-code | dress.webp | `dress-title`, `dress-note` |
| Gallery | gallery | 4 placeholder imgs | `data-bind="gallery"` |
| RSVP | rsvp | — (form in HTML) | 8+ label fields |
| Final | footer | hero-poster bg | `final-text` |

**Max-width:** 430px (mobile-first).  
**Fonts (self-hosted):** Cormorant Garamond, Asylbek Shelley (`T23Script`), Ceremonious (`T23Cer`), Montserrat.  
**KZ cyrillic-ext:** explicit `unicode-range` in `@font-face`.  
**Assets path:** `/template-assets/uzatu-template23/` — 15+ webp + 1 webm.

### 3.3 Механизм редактора (`/invite/new-live`)

```html
<h1 data-edit-id="hero-name" data-kk="Дана" data-ru="Дана">Дана</h1>
<section data-edit-container data-edit-id="sec-1">...</section>
<div data-bind="date" data-fmt-kk="YYYY ж. D MMMM">...</div>
<a data-bind="map" data-edit-id="map-label">...</a>
```

- Редактор парсит `data-edit-id` → строит форму
- `data-kk` / `data-ru` — bilingual defaults
- `data-bind` — dynamic widgets (countdown, date format, map URL, gallery, music)
- Preview = iframe с live HTML (не React re-render)

### 3.4 Pricing / product (из FAQ и landing)

| Tier | Цена | Особенности |
|------|------|-------------|
| Free | 0 ₸ | Watermark |
| Стандарт | 2 990 ₸ | Музыка, без watermark, unlimited guests |
| Премиум | 4 990 ₸ | Анимированные шаблоны, AI-помощник |

6 категорий той: wedding (22), uzatu (19), sundet (9), tusau (7), merey (16), besik (6).

### 3.5 Что у них объективно круто

1. **HTML-template pipeline** — новый дизайн = новый `.html` файл, **без** React component per template. Масштаб 118 шаблонов.
2. **Art direction per template** — каждый уникален (video hero, rose frames, palette). Не generic sections.
3. **KZ typography done right** — self-hosted woff2, unicode-range, script + ceremonial fonts.
4. **Dress code + gallery** — секции, которых у нас нет.
5. **Event-specific forms** — uzatu = одно имя (`hero-name`), не groom/bride pair.
6. **Performance awareness** — lazy analytics, font preload, `font-display: optional`.

### 3.6 Что у них слабее / не факт что лучше

1. Backend depth — не видно guest tokens, wish reactions, payment integrity уровня нашего Kaspi flow.
2. SURET tier — ограниченная гибкость vs full HTML, но быстрый production.
3. RSVP в template23 — embedded HTML form, не персональные guest links (как у нас).

---

## 4. QazShaqyru — текущее состояние (Phase 1–2)

### 4.1 Архитектура (что уже есть)

```
QuickEditPage (form)
    → mapManifestFieldsToInvitation()
    → InvitationData + customText + templateData
    → SectionRenderer (React)
    → /i/[slug] guest view
```

**Ключевые файлы:**

| Файл | Роль |
|------|------|
| `lib/templates/manifest-types.ts` | TemplateManifest, SectionType, TemplateFieldDef |
| `lib/templates/manifests/wedding-luxury.ts` | Единственный manifest |
| `lib/templates/map-manifest-to-invitation.ts` | Form ↔ Invitation mapping + Zod |
| `components/quick-edit/QuickEditPage.tsx` | Form + live preview |
| `components/invitation-layouts/SectionRenderer.tsx` | Section router |
| `components/invitation-layouts/sections/*` | 10 section components |
| `generate_assets.py` | Procedural asset generation |

### 4.2 Секции wedding-luxury

`envelope-intro`, `hero-names`, `body-invitation`, `cover-photo`, `calendar`, `countdown`, `venue-map`, `rsvp`, `wishes`, `music`

### 4.3 Поля quick-edit form

`groomName`, `brideName`, `hostsLine`, `eventDate`, `eventTime`, `venueName`, `venueAddress`, `mapUrl`, `bodyTextKz`, `coverPhoto`

### 4.4 Что у нас уже на уровне или лучше

| Область | Оценка |
|---------|--------|
| Quick-edit UX (form + live preview) | **Паритет** с обоими конкурентами (Phase 2 done) |
| Manifest-driven validation (Zod) | **Лучше** ad-hoc schemas |
| Backend: Prisma, guest tokens, open RSVP | **Лучше** (гость не видит) |
| Wish reactions | **Есть у нас**, у них просто wall |
| Kaspi payment flow | **Есть у нас** |
| i18n ru/kz labels from manifest | **Есть** |
| Section reuse architecture | **Правильнее** long-term vs Tyrasoft canvas |

### 4.5 Где мы объективно хуже — без сахара

| # | Область | Мы | Они | Severity |
|---|---------|-----|-----|----------|
| 1 | **Количество шаблонов** | 1 | 79–118+ | 🔴 Critical |
| 2 | **Visual polish** | procedural PNG/WebP | designer frames, video, Lottie | 🔴 Critical |
| 3 | **KZ fonts** | `--font-display/body` generic | KZ_RomulC, Asylbek Shelley, Ceremonious | 🔴 Critical |
| 4 | **Per-template identity** | один generic section layout | каждый шаблон уникален | 🔴 Critical |
| 5 | **Video hero** | нет | toi template23 hero.webm | 🟠 High |
| 6 | **Lottie / motion** | CSS only | 8 Lottie (Shaqyru24) | 🟠 High |
| 7 | **Gallery section** | нет | toi 4-slot grid | 🟠 High |
| 8 | **Dress code section** | нет | toi отдельный блок | 🟡 Medium |
| 9 | **Program / timeline** | partial in customText legacy | оба имеют | 🟡 Medium |
| 10 | **Calendar widget polish** | basic | heart marker, KZ weekdays, custom fonts | 🟡 Medium |
| 11 | **Asset pipeline** | `generate_assets.py` procedural | 15–25 designer webp per template | 🔴 Critical |
| 12 | **Template production speed** | 1 template = weeks of React | toi: 1 html file = 1 day | 🔴 Critical |
| 13 | **Envelope intro animation** | static | Lottie / video open | 🟡 Medium |
| 14 | **Event-type forms** | wedding-centric (groom/bride) | uzatu = single name, etc. | 🟡 Medium |
| 15 | **Pricing tiers / free watermark** | single 3990 ₸ | 0 / 2990 / 4990 | 🟡 Business |
| 16 | **AI assistant** | нет | toi Premium | 🟢 Low priority |

**Итог одной строкой:** UX создания мы догнали. **Всё, что видит глаз — мы хуже. Это сложно исправить быстро, но без этого продукт не конкурирует.**

---

## 5. Сравнение архитектур — что менять, что нет

### 5.1 Три пути масштабирования шаблонов

| Путь | Кто использует | Плюсы | Минусы | Вердикт для нас |
|------|----------------|-------|--------|-----------------|
| **Canvas builder (Tyrasoft)** | Shaqyru24 | 100+ templates, max flexibility | 12–18 мес., нужен Tyrasoft или свой builder | ❌ Не сейчас |
| **HTML template + data-edit-id** | toi.com.kz | 1 template = 1 html, быстрый production | iframe preview, sanitization, less type-safe | ✅ **Рассмотреть Phase 4+** |
| **Section manifest + React** | QazShaqyru (наш) | Type-safe, reusable sections, testable | Каждый visual style = CSS/assets work | ✅ **Оставить как core**, но сменить asset pipeline |
| **SURET (image + text slots)** | toi.com.kz | Очень быстрый новый «дизайнерский» шаблон | Мало гибкости | ✅ **Добавить как tier** для быстрого каталога |

### 5.2 Рекомендуемая эволюция (не revolution)

```
Сейчас:     React SectionRenderer + procedural assets     ← визуально слабо
Phase 3:    + KZ fonts + designer assets + Lottie(1-2)   ← паритет 1 шаблона
Phase 4:    + HTML template renderer (toi-style)          ← масштаб каталога
Phase 4+:   + SURET tier                                  ← быстрые image templates
Никогда v1: Full Tyrasoft canvas для пользователя
```

---

## 6. Чеклист «заменить как у них» — по компонентам

### 6.1 Typography — 🔴 MUST FIX

| | Shaqyru24 | toi.com.kz | Мы | Action |
|---|-----------|------------|-----|--------|
| Display KZ | KZ_RomulC | Asylbek Shelley | generic serif | Self-host 2–3 KZ display fonts |
| Body KZ | KZOptima | Cormorant Garamond | system-ui | Self-host body font with cyrillic-ext |
| Labels | KZPFMonumentaPro | Montserrat | — | Add sans label font |
| unicode-range | ? | explicit Ә,Ө,Ұ,Ң | missing | Copy toi pattern |

**Сложность:** средняя (лицензии + woff2 subsetting). **Impact:** огромный — без этого «luxury» не выглядит luxury.

### 6.2 Assets — 🔴 MUST FIX

| Asset type | Shaqyru24 | toi template23 | Мы | Action |
|------------|-----------|----------------|-----|--------|
| Frame backgrounds | tyrasoft webp layers | frame-greeting.webp, frame-date.webp | corner PNG placeholders | Designer frames per template |
| Dividers | image layers | divider-hero/card/rose.webp | divider-01.png procedural | Designer dividers |
| Hero | static images + video | hero.webm + poster | bgCover webp | Optional video hero |
| Confetti/ornaments | Lottie (8) | confetti webp | none | 1 Lottie OR static confetti |
| Gallery | — | 4 webp slots | none | Add gallery section |
| Dress code | — | dress.webp + text | none | Add dress-code section |

**Сложность:** высокая — нужен art director + `generate_assets.py` → designer pipeline OR HF with strict art direction. Procedural **не конкурирует**.

### 6.3 Sections / widgets

| Section | Shaqyru24 | toi | Мы | Gap |
|---------|-----------|-----|-----|-----|
| Hero names | 4 text slots + decor | video + script name | HeroNamesSection | video, script font |
| Body text | long text layer | invite-text | BodyInvitationSection | OK structure, weak typography |
| Countdown | timer widget | CSS + bind | CountdownSection | polish fonts/colors |
| Calendar | full widget | date format only | CalendarSection | they win on calendar |
| Venue + map | text + button | location-lines + map btn | VenueMapSection | similar, weaker styling |
| RSVP | form2 | embedded form | RsvpSection | we have backend advantage |
| Wishes | wall + auto-scroll | — in template23 | WishesSection | we have reactions |
| Music | audio-fixed styled | music toggle btn | MusicSection | similar |
| Dress code | — | yes | **MISSING** | add |
| Gallery | — | yes | **MISSING** | add |
| Envelope intro | Lottie? | — | envelope-intro static | add animation |

### 6.4 Editor / form

| | Shaqyru24 | toi | Мы (Phase 2) | Gap |
|---|-----------|-----|--------------|-----|
| Single-page form | ✓ | ✓ | ✓ QuickEditPage | **Closed** |
| Live preview | ✓ | ✓ iframe | ✓ SectionRenderer | **Closed** |
| Bilingual fields | ✓ | data-kk/data-ru | manifest labelRu/Kz | minor: add bodyTextRu field |
| Event-specific fields | ✓ | ✓ (single name for uzatu) | wedding-only | extend manifest per category |
| Extended editor | admin? | — | removed from UX | **Correct decision** |

### 6.5 Backend (наше преимущество — не трогать)

- Guest personal tokens ✓
- Wish reactions ✓
- Kaspi checkout ✓
- Order reconciliation ✓
- Rate limiting ✓

**Не заменять их backend-паттернами. Улучшать только guest-visible layer.**

---

## 7. Честная матрица «у кого что»

| Capability | Shaqyru24 | toi.com.kz | QazShaqyru | Winner |
|------------|-----------|------------|-----------|--------|
| Template count | 100+ | 79+118 | 1 | **They** |
| Visual wow mobile | ★★★★★ | ★★★★★ | ★★☆☆☆ | **They** |
| KZ typography | ★★★★★ | ★★★★★ | ★★☆☆☆ | **They** |
| Form-first editor | ★★★★☆ | ★★★★☆ | ★★★★☆ | Tie |
| Template production | ★★★★★ (Tyrasoft) | ★★★★★ (HTML) | ★★☆☆☆ (React) | **They** |
| Animations | ★★★★★ (Lottie×8) | ★★★★☆ (video) | ★★☆☆☆ | **They** |
| RSVP backend | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | **Us** |
| Guest tokens | ? | ? | ★★★★★ | **Us** |
| Payments KZ | ? | ★★★☆☆ | ★★★★☆ | **Us** |
| Wish reactions | ★★☆☆☆ | — | ★★★★☆ | **Us** |
| Code architecture | ★★☆☆☆ (vendor lock) | ★★★★☆ | ★★★★☆ | **Us** (long-term) |
| Time to first wow | ★★★★★ | ★★★★★ | ★★☆☆☆ | **They** |

---

## 8. Как передать данные агенту (если live URL недоступен)

### 8.1 Shaqyru24

1. Открыть view URL → View Source
2. Скопировать `<script id="__NEXT_DATA__">...</script>` → `scripts/shaqyru24_<pageId>.json`
3. Или Save Page As → `temp_shaqyru24_*.html`
4. Запустить: `py scripts/parse_shaqyru24_full.py temp_shaqyru24_*.html`

### 8.2 toi.com.kz

1. DevTools → Network → filter JS
2. Найти `template23-*.js` или `index-*.js`
3. Save → `scripts/toi_template23.js`
4. Запустить: `py scripts/extract_toi_templates.py`

### 8.3 Visual parity check

1. Screenshot mobile 390px: competitor demo vs `/i/demo?layout=wedding-luxury`
2. Side-by-side в `docs/competitor-screens/`
3. Acceptance: «не хуже» = subjective but mandatory before shipping template

---

## 9. PROMPT ДЛЯ СЛЕДУЮЩЕГО АГЕНТА

Скопировать целиком:

```
Ты работаешь над QazShaqyru (c:\shaqyru), apps/web (Next.js 14, Prisma, Tailwind).

ОБЯЗАТЕЛЬНО прочитай ПЕРЕД любым кодом:
1. docs/COMPETITOR_ANALYSIS.md  ← этот файл, честная оценка vs Shaqyru24 и toi.com.kz
2. docs/HANDOFF_TEMPLATE_SYSTEM.md ← стратегия Phase 1–5

## Контекст без illusions

Мы объективно ХУЖЕ Shaqyru24 и toi.com.kz по всему, что видит пользователь:
- визуал шаблонов
- KZ типографика
- каталог (1 vs 79–118+)
- art assets (procedural vs designer)
- анимации (CSS vs Lottie/video)

Phase 1–2 СДЕЛАНЫ — не ломай:
- TemplateManifest + SectionRenderer + wedding-luxury
- QuickEditPage (/invitations/quick?template=wedding-luxury)
- mapManifestFieldsToInvitation + Zod
- RSVP / Kaspi / guest tokens / wishes backend

Backend у нас сильнее — НЕ трогай payments, tokens, guest API без причины.

## Референсы (изучить артефакты в репо)

Shaqyru24 wedding demo:
https://www.shaqyru24.kz/view?builder_page_id=c196b73b-7c96-447d-b6c9-26986906f24c&site_id=370&status=demo
→ temp_shaqyru24_wedding370.html, scripts/shaqyru24_v2_inventory.md

toi.com.kz uzatu editor:
https://toi.com.kz/invite/new-live?template=uzatu%2Ftemplate23.html
→ temp_toi_template23.js (ПОЛНЫЙ HTML шаблона!), temp_toi_index.js (catalog 118 templates)

Ключевой вывод: у обоих текст = HTML, картинки = декор. НЕ canvas builder для пользователя.

## Твоя задача — Phase 3 + подготовка Phase 4

Цель: 1 шаблон wedding-luxury визуально НЕ ХУЖЕ Shaqyru24 c196b73b на mobile 390px.
Side-by-side screenshot = acceptance criteria.

### Priority 1 — MUST (без этого не ship)

1. KZ FONTS self-hosted
   - Минимум: 1 display (script/romul-style), 1 body (serif), 1 sans (labels)
   - unicode-range для Ә, Ө, Ұ, Ң, Ғ, Қ, І
   - Референс: toi temp_toi_template23.js @font-face blocks
   - НЕ Google Fonts без cyrillic-ext subset

2. DESIGNER ASSETS вместо procedural
   - Заменить public/assets/templates/wedding-luxury/* placeholders
   - Минимум per template: frame-bg×2, dividers×3, hero (webp + optional webm), confetti/ornament
   - Art direction: .cursor/skills/art-director/SKILL.md
   - generate_assets.py — только для drafts; prod assets = designer/HF с strict brief

3. VISUAL PARITY checklist vs c196b73b:
   - [ ] Hero: headline KZ + names in display font (4 slots or equivalent)
   - [ ] Body: long KZ preset text, readable line-height
   - [ ] Calendar: highlighted date, KZ month names
   - [ ] Countdown: styled numbers + KZ labels
   - [ ] Venue: place + address + map CTA button
   - [ ] RSVP + wishes + music — уже есть, polish styling

### Priority 2 — HIGH (если влезает в sprint)

4. NEW SECTIONS in manifest:
   - dress-code (from toi template23)
   - gallery (4 slots, upload in quick-edit)
   - final-text footer block

5. LOTTIE (max 1–2 per template, NOT 8):
   - envelope open OR confetti
   - lazy load, respect prefers-reduced-motion

6. VIDEO HERO (optional manifest flag):
   - webm + poster pattern from toi template23

### Priority 3 — Phase 4 prep (architecture, не full impl)

7. HTML TEMPLATE RENDERER (toi-style)
   - Spike: render temp_toi_template23.js HTML in sandbox iframe OR server-side with data-edit-id binding
   - Goal: новый шаблон = html file + assets folder, NOT new React section CSS
   - Keep SectionRenderer for flagship; add HtmlTemplateRenderer for scale

8. SURET TIER spike
   - background.webp + text slots { id, top%, font, color, defaultText kk/ru }
   - 1 pilot template

### Priority 4 — manifest/form extensions

9. Event-type field profiles:
   - wedding: groomName + brideName
   - uzatu: honoreeName (single)
   - Extend manifest-types.ts, NOT hardcode in QuickEditPage

10. bodyTextRu field in form (already in resolveManifestFields, not in wedding-luxury fields)

## Anti-patterns — НЕ ДЕЛАТЬ

❌ Full Tyrasoft canvas builder (x/y/z, 53 layers)
❌ «Наш стек лучше» вместо визуальной работы
❌ Procedural assets as final product
❌ 8 Lottie animations
❌ Ломать QuickEditPage / publish flow / e2e
❌ Extended EditorToolbar в user flow
❌ Phase 4 full catalog before 1 template visual parity

## Verification

- pnpm exec vitest run
- pnpm exec next build
- Visual: /i/demo?layout=wedding-luxury vs Shaqyru24 c196b73b — mobile 390px screenshot
- /invitations/quick?template=wedding-luxury — form + live preview still works

## Файлы для чтения

| Файл | Зачем |
|------|-------|
| docs/COMPETITOR_ANALYSIS.md | Полный разбор конкурентов |
| temp_toi_template23.js | Эталон HTML template structure |
| temp_shaqyru24_wedding370.html | Tyrasoft component inventory |
| lib/templates/manifests/wedding-luxury.ts | Наш manifest — расширять |
| components/invitation-layouts/sections/* | Polish targets |
| components/quick-edit/QuickEditPage.tsx | Не ломать |
| generate_assets.py | Заменить pipeline, не удалять сразу |
| .cursor/skills/art-director/SKILL.md | Art direction |

## Tone

Будь честен: если после Phase 3 всё ещё хуже — скажи прямо и что ещё нужно.
Не хвали «архитектуру» вместо pixels on screen.
Success = guest opens /i/[slug] on phone and says «вау», not «works fine».
```

---

## 10. Связанные документы

| Документ | Связь |
|----------|-------|
| `docs/HANDOFF_TEMPLATE_SYSTEM.md` | Phase roadmap, anti-patterns |
| `scripts/shaqyru24_v2_inventory.md` | Component-level Shaqyru24 inventory |
| `.cursor/skills/art-director/SKILL.md` | Art direction для asset pipeline |

---

*Анализ: reverse-engineering Shaqyru24 Tyrasoft JSON + toi.com.kz JS bundles, 2026-07-05. Обновлять при новых competitor screenshots или saved HTML.*
