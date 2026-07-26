# HANDOFF: Перестройка системы шаблонов QazShaqyru

> **Для кого:** следующий AI-агент / разработчик.
> **Репозиторий:** `c:\shaqyru`, приложение: `apps/web` (Next.js 14, Prisma, Tailwind).
> **Обновлено:** 2026-07-05 — добавлено стратегическое решение, честная оценка vs Shaqyru24.

---

## 0. СТРАТЕГИЧЕСКОЕ РЕШЕНИЕ (прочитать первым)

### 0.1 Ограничения

- Партнёрства с **Tyrasoft не будет** — их builder как сервис недоступен.
- Продуктово мы **сейчас хуже** [Shaqyru24](https://shaqyru24.kz) по визуалу, каталогу и UX создания. Это факт, не маркетинг.

### 0.2 Развилка: full builder vs narrow React flagship

| Вариант | Плюсы | Минусы | Вердикт |
|---------|-------|--------|---------|
| **Full canvas builder** (как Tyrasoft: 53 слоя, x/y/z, Lottie) | Масштаб 100+ шаблонов, паритет с конкурентом | **12–18+ мес.**, отдельный продукт внутри продукта, нужна команда | ❌ **Не сейчас** |
| **Только narrow React flagship** (1–3 шаблона в коде) | Можно за **2–4 недели** | Навсегда проигрыш по каталогу; каждый шаблон = новый React-файл | ❌ **Не как финальная модель** |
| **✅ Выбрано: flagship → declarative section templates** | Ship быстро + путь к масштабу без canvas | Не 100% паритет с Tyrasoft по гибкости дизайна | ✅ **Оптимум** |

### 0.3 Что выбрано объективно

**Гибрид в два этапа — «form-first + section-based templates»:**

```
Сейчас (Phase 1–3):  1 эталонный шаблон wedding-luxury в React + form quick-edit
Следом (Phase 4+):   шаблон = JSON/TS manifest секций, не новый .tsx на каждый дизайн
Никогда (v1):        canvas builder с абсолютным позиционированием как у Tyrasoft
```

**Почему не full builder:** без Tyrasoft это год+ работы, пока конкурент уже на 100+ шаблонах. Риск — умереть в разработке, не выпустив продукт.

**Почему не только flagship:** один красивый шаблон не конкурирует с каталогом. Но **без первого flagship** declarative-систему не на чем проектировать.

**Почему section-based — лучший компромисс:**
- UX как у них: **форма полей**, не WYSIWYG для пользователя
- Новый шаблон = новый `TemplateManifest` (секции + ассеты + field bindings), **без** 52 координат
- Секции переиспользуются: `hero`, `body-text`, `countdown`, `calendar`, `venue-map`, `rsvp`, `wishes`, `music`
- Позже — внутренний admin для сборки секций (не пользовательский canvas)

### 0.4 Честная цель по срокам

| Горизонт | Цель | vs Shaqyru24 |
|----------|------|--------------|
| **4 недели** | 1 шаблон wedding KZ не хуже их demo `5b78d64a` + quick-edit форма | Паритет **одного** шаблона, не платформы |
| **3 месяца** | 5–8 шаблонов через section manifests | Всё ещё меньше каталога, но уже конкурентно |
| **12 месяцев** | 20+ шаблонов + internal template tooling | Приближение к ним без canvas builder |

---

## 1. Контекст продукта

**QazShaqyru** — цифровые приглашения для торжеств в Казахстане.

- Публикация: **3 990 ₸**
- Гость: `/i/[slug]`
- Создание: `/invitations/quick?template=...` → станет **quick-edit**
- Legacy (убрать из UX): `/invitations/new`, `EditorToolbar` с 10+ панелями

**Текущее состояние (2026-07-05, после Phase 1–2):**
- `LayoutRouter` → `SectionRenderer` для manifest-шаблонов ✓
- `wedding-luxury` manifest + assets + quick-edit ✓
- Каталог: **1 шаблон** vs 79–118+ у конкурентов — см. `docs/COMPETITOR_ANALYSIS.md`
- Визуал: procedural assets — **объективно слабее** Shaqyru24 / toi.com.kz

---

## 2. Конкурент Shaqyru24 (кратко)

**Исследованные URL:**
- [Demo view](https://www.shaqyru24.kz/view?builder_page_id=5b78d64a-665e-41fe-8973-036a63df6172&site_id=85790&status=demo&owner=true)
- [Quick edit](https://www.shaqyru24.kz/kz/quick-edit?page_id=5b78d64a-665e-41fe-8973-036a63df6172&site_id=85790&from=main_view)

**Артефакты анализа в репо:**
- **`docs/COMPETITOR_ANALYSIS.md`** — полный разбор Shaqyru24 + toi.com.kz vs QazShaqyru + prompt для агента (2026-07-05)
- `scripts/shaqyru24_v2_inventory.md` — 52 компонента шаблона
- `scripts/analysis_temp_shaqyru24_v2.html.json` — полный `pageProps`
- `temp_shaqyru24_v2.html` — сырой HTML

**Их модель:**
- Tyrasoft page builder: JSON `blocks[]`, container ~5700px, абсолютные координаты
- 16 image + 12 text + 8 Lottie + calendar + timer + RSVP + wishes + music
- Пользователь заполняет **форму** (имена, дата, место) — не двигает canvas
- 100+ шаблонов, ~4900 ₸

**Где они сильнее нас (всё):** визуал, каталог, UX, зрелость, KZ-шрифты, анимации, time-to-wow.

**Где наш backend потенциально силён (гость не видит):** структурная БД, wish reactions, pricing integrity, свой Kaspi flow — **но это не продаёт**, пока нет визуала.

---

## 3. Целевая архитектура

### 3.1 Принцип: form-first, section-driven

```
QuickEditForm (поля)  →  mapFieldsToInvitation()  →  SectionRenderer  →  /i/[slug]
                              ↓
                    Invitation + customText + templateData
```

Пользователь **никогда** не видит canvas-редактор. Только форма + live preview.

### 3.2 TemplateManifest (целевая модель данных)

Phase 1: manifest захардкожен в TS для `wedding-luxury`.
Phase 4+: manifest в `Template.config` JSON в БД или `lib/templates/manifests/*.ts`.

```typescript
// apps/web/src/lib/templates/manifest-types.ts (создать)
interface TemplateManifest {
  slug: string;
  sections: TemplateSection[];  // упорядоченный scroll
  fields: TemplateFieldDef[];   // поля quick-edit формы
  assets: Record<string, string>;
  theme: { accent: string; fonts: { display: string; body: string } };
}

type SectionType =
  | 'envelope-intro'
  | 'hero-names'
  | 'body-invitation'
  | 'cover-photo'
  | 'calendar'
  | 'countdown'
  | 'venue-map'
  | 'rsvp'
  | 'wishes'
  | 'music';

interface TemplateSection {
  type: SectionType;
  props?: Record<string, unknown>;  // variant, ornament set, etc.
  fieldBindings?: Record<string, string>;  // prop → field key
}

interface TemplateFieldDef {
  key: string;           // groomName, brideName, eventDate...
  type: 'text' | 'date' | 'time' | 'textarea' | 'image' | 'url';
  required: boolean;
  labelRu: string;
  labelKz: string;
  defaultKz?: string;
  defaultRu?: string;
}
```

**Отличие от Tyrasoft:** секции = semantic blocks, не 52 слоя с `(x,y,z)`. Достаточно для 90% KZ wedding invites.

### 3.3 Deprecate в UX

- Убрать «Расширенный редактор» из QuickWizard
- `EditorToolbar` / `EditableField` inline — **не** для обычного пользователя (admin flag или удалить позже)
- `QuickWizard` 5 шагов → **`QuickEditPage`**: одна форма + preview (split mobile: preview сверху)

### 3.4 Первый шаблон: `wedding-luxury`

**Секции (паритет demo `5b78d64a`):**
1. `envelope-intro`
2. `hero-names` — «ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ» + groomName + brideName (4 слота как у них)
3. `body-invitation` — KZ текст с подстановкой имён
4. `cover-photo` (optional)
5. `calendar` + `countdown`
6. `venue-map` — место + кнопка карты
7. `rsvp`
8. `wishes`
9. `music`

**Поля формы (минимум):**

| key | тип | куда |
|-----|-----|------|
| groomName | text | hero (2 слота) + body template |
| brideName | text | hero (2 слота) + body template |
| hostsLine | text | «Құрметпен, той иелері:» |
| eventDate | date | calendar, timer, DB |
| eventTime | time | отображение «той уакыты» |
| venueName | text | место |
| venueAddress | text | адрес |
| mapUrl | url | кнопка 2GIS/Google |
| bodyTextKz | textarea | основной текст (default preset) |
| coverPhoto | image | optional |
| language | ru/kz | i18n |

---

## 4. Фазы работ (для агента)

### Phase 1 — Flagship render (неделя 1) ⬅️ **НАЧАТЬ ЗДЕСЬ**

- [ ] `lib/templates/manifest-types.ts` + `manifests/wedding-luxury.ts`
- [ ] `SectionRenderer.tsx` + секции в `invitation-layouts/sections/`
- [ ] Подключить в `LayoutRouter` вместо `PlaceholderLayout`
- [ ] Assets: `generate_assets.py` → `public/assets/templates/wedding-luxury/`
- [ ] `configs.ts` заполнить
- [ ] Verify: `/api/invitations/public/demo?layout=wedding-luxury`, mobile 390px

### Phase 2 — Quick-edit form (неделя 2)

- [ ] `components/quick-edit/QuickEditPage.tsx` — форма + live preview
- [ ] `mapManifestFieldsToInvitation()` + Zod validation
- [ ] Заменить route `/invitations/quick` на quick-edit UX
- [ ] Убрать «Расширенный редактор» из user flow
- [ ] i18n ru/kz все labels

### Phase 3 — Widgets parity (неделя 2–3)

- [ ] `CountdownSection`, `CalendarSection`, `VenueMapSection`
- [ ] Подключить `WishesWall`, music prompt, RSVP из `LayoutRouter`
- [ ] KZ display font (Google Fonts cyrillic-ext или self-host)

### Phase 4 — Section manifest system (неделя 3–4)

- [ ] Второй шаблон **только через manifest** (напр. `betashar-peach`) — без нового layout .tsx
- [ ] `Template.config` в seed/DB хранит manifest JSON
- [ ] Документ: как добавить шаблон за 1 день (manifest + assets)

### Phase 5 — Не делать в v1

- ❌ Canvas builder с drag-and-drop
- ❌ Абсолютное позиционирование x/y/z
- ❌ 8 Lottie на шаблон (макс 1–2 позже)
- ❌ Пользовательский WYSIWYG

---

## 5. Ключевые файлы

| Файл | Действие |
|------|----------|
| `LayoutRouter.tsx` | Подключить SectionRenderer |
| `PlaceholderLayout.tsx` | Заменить / удалить из router |
| `configs.ts` | Заполнить wedding-luxury |
| `types.ts` | Расширить при необходимости |
| `QuickWizard.tsx` | Заменить на QuickEditPage |
| `quick-wizard-schema.ts` | Заменить на manifest field defs |
| `EditorToolbar.tsx` | Deprecate для users |
| `generate_assets.py` | Генерация template assets |
| `scripts/shaqyru24_v2_inventory.md` | Визуальный референс |
| `.cursor/skills/art-director/SKILL.md` | Art direction |

---

## 6. Acceptance criteria (Phase 1–3)

1. Гость `/i/[slug]` — scroll-приглашение, не заглушка, mobile 390px
2. Организатор: форма (жених, невеста, дата, место) → live preview
3. Есть: countdown, calendar, RSVP, wishes, music, map button
4. KZ default text + ru/kz
5. `pnpm exec next build` OK
6. Нет canvas editing для пользователя
7. Визуально **не хуже** demo `5b78d64a` (субъективно — side-by-side скриншот)

---

## 7. Anti-patterns

- Не копировать Tyrasoft JSON 1:1
- Не хвалить «наш стек» вместо визуала
- Не использовать старые template assets
- Не ломать RSVP / Kaspi / guest tokens
- Не добавлять full builder в scope Phase 1–3

---

## 8. Prompt для нового агента (копировать целиком)

```
Ты работаешь над QazShaqyru (c:\shaqyru).

ОБЯЗАТЕЛЬНО прочитай docs/HANDOFF_TEMPLATE_SYSTEM.md — там стратегическое решение.

Контекст: мы хуже Shaqyru24 по продукту. Tyrasoft недоступен. Выбран путь:
  flagship wedding-luxury → section-based template manifests (НЕ full canvas builder).

Твоя задача — Phase 1 из HANDOFF:
1. Создать TemplateManifest + SectionRenderer + секции для wedding-luxury
2. Заменить PlaceholderLayout в LayoutRouter
3. Сгенерировать assets в public/assets/templates/wedding-luxury/ через generate_assets.py
4. Проверить demo route и mobile preview

Референс конкурента: scripts/shaqyru24_v2_inventory.md
Demo URL: https://www.shaqyru24.kz/view?builder_page_id=5b78d64a-665e-41fe-8973-036a63df6172&site_id=85790&status=demo&owner=true

UX: form-first (как их quick-edit), без WYSIWYG для пользователя.
Не ломай RSVP/payments/i18n. После Phase 1: next build + визуальная проверка.

Следующие фазы (не начинать пока Phase 1 не готов): QuickEditPage, widgets, второй manifest-шаблон.
```

---

*Документ: анализ Shaqyru24 reverse-engineering + стратегическое решение 2026-07-05.*
