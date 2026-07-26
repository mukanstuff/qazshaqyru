# Figma → TemplateManifest Workflow

Цель: получать production-ready шаблоны приглашений без ручного хаоса в слоях и без потерь при переносе в `TemplateManifest`.

## 1) Структура Figma-файла

Используйте один файл = один шаблон, с фиксированной иерархией страниц:

1. `00-Guidelines`
2. `01-Mobile-Base` (основной источник)
3. `02-Desktop-Preview` (не источник данных, только визуальная проверка)
4. `90-Export`

Для MVP-потока источником всегда считается `01-Mobile-Base`.

## 2) Базовые размеры и сетка

- Базовый фрейм шаблона: `430 x Auto` (mobile-first).
- Safe content width: `390`.
- Горизонтальные отступы: `20`.
- Вертикальный ритм: шаг `8`.
- Минимальная высота hero: `780`.

Ключевое правило: итоговый HTML/CSS рендер должен визуально совпадать с `430px` фреймом без ручных “подгонов”.

## 3) Именование слоёв (обязательно)

Все редактируемые поля должны иметь префикс `fld/`.
Все декоративные ассеты должны иметь префикс `asset/`.

Примеры:

- `fld/groomName`
- `fld/brideName`
- `fld/eventDate`
- `fld/eventTime`
- `fld/venueName`
- `fld/venueAddress`
- `fld/bodyTextKz`
- `fld/bodyTextRu`
- `fld/finalText`
- `asset/divider-hero`
- `asset/frame-greeting`
- `asset/corner-tl`

Запрещено:

- Случайные имена вроде `Rectangle 382`, `Copy 2`, `Text`.
- Смешивать редактируемый текст и декоративный текст в одном слое.

## 4) Текст и мультиязычность

- Основной текст в Figma всегда хранится как текстовый слой, не растр.
- Для RU/KZ полей используйте отдельные поля (`bodyTextRu`, `bodyTextKz`), не “двуязычный абзац в одном слое”.
- Не конвертируйте заголовки/имена в outline для web-версии.

## 5) Экспорт ассетов

Экспорт только из страницы `90-Export`.

- Фото/фон: `webp` (quality 80–90).
- Лёгкие орнаменты/линии: `png`.
- Иконки и простая векторка: `svg` (если не ломается в браузере).
- Нейминг файлов: kebab-case без пробелов.

Путь в проекте:

`apps/web/public/assets/templates/<template-slug>/...`

## 6) Маппинг в TemplateManifest

Файл манифеста: `apps/web/src/lib/templates/manifests/<template-slug>.ts`

Минимальные блоки:

1. `slug`
2. `theme`
3. `assets`
4. `fields`
5. `sections`

### 6.1 assets

Каждый `asset/*` в Figma должен иметь ключ в `assets`:

- `asset/frame-greeting` → `assets.frameGreeting`
- `asset/divider-hero` → `assets.divider`

### 6.2 fields

Каждый `fld/*` должен иметь поле в `fields`:

- `fld/groomName` → `{ key: 'groomName', type: 'text', ... }`
- `fld/eventDate` → `{ key: 'eventDate', type: 'date', ... }`

### 6.3 sections

Секции должны связывать поля через `fieldBindings`:

- `hero-names`: `groomName`, `brideName`
- `calendar`: `eventDate`
- `venue-map`: `venueName`, `venueAddress`, `mapUrl`

## 7) QA перед интеграцией

Перед merge обязательно:

1. Проверка в `430px`, `390px`, `360px` ширине.
2. Проверка длинных имён (минимум 24 символа).
3. Проверка KZ символов: `Ә Ө Ұ Ү Қ Ғ Ң Һ І`.
4. Проверка fallback без `coverPhoto`/gallery.
5. Проверка читаемости на светлом и тёмном фоне hero.

## 8) Definition of Done для нового шаблона

Шаблон считается готовым только если:

1. Все `fld/*` замаплены в `fields`.
2. Все `asset/*` замаплены в `assets` и существуют в `public/assets`.
3. `SectionRenderer` рендерит без runtime ошибок.
4. Quick-edit форма валидируется `buildManifestFormSchema`.
5. Визуальный smoke-test пройден на mobile + editor preview.
