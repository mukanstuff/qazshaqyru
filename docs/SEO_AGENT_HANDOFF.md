# Handoff: SEO foundation для QazShaqyru

Скопируй блок **«Промпт для агента»** целиком в новый чат.

---

## Промпт для агента

```
Ты работаешь над QazShaqyru (репозиторий c:\shaqyru, apps/web — Next.js App Router).

## Контекст продукта

QazShaqyru — сервис цифровых приглашений для тоев и семейных торжеств в Казахстане (kk + ru).
Дифференциатор продукта: не только красивый шаблон, а Guest Ops — RSVP, семьи, рассадка, CSV/портал для тойханы.
Домена в продакшене ещё нет (это ожидаемо). В коде placeholder домена: https://qazshaqyru.kz. Бренд везде: QazShaqyru (старые имена Invito / u-shaqyru уже вычищены — не возвращай их).

Цель этой задачи: заранее подготовить SEO-фундамент (техника + контентная архитектура + первые качественные страницы), чтобы после покупки домена и подключения GSC можно было быстро индексироваться и конкурировать с toi.com.kz / shaqyru24.kz / bizdetoi и др.

## Обязательно прочитай перед работой

1. Canvas со стратегией и аудитом (открой и изучи целиком):
   C:\Users\muham\.cursor\projects\c-shaqyru\canvases\qazshaqyru-seo-strategy.canvas.tsx
2. Текущий код: apps/web/src/app/sitemap.xml/route.ts, apps/web/public/robots.txt,
   apps/web/src/components/seo/SeoEventLanding.tsx, apps/web/src/app/layout.tsx,
   apps/web/src/app/templates/[category]/page.tsx, apps/web/src/lib/site/footer-links.ts,
   apps/web/src/components/landing/LandingFaq.tsx, apps/web/content/blog/**

## Скиллы

Сам подбери и прочитай релевантные скиллы с компьютера (не жди списка от пользователя).
Ищи в:
- C:\Users\muham\.cursor\skills\
- c:\shaqyru\.cursor\skills\

Ожидаемо полезны (подбери по факту задачи): seo-plan / seo-audit / seo-technical / seo-schema /
schema-markup / programmatic-seo / seo-hreflang / seo-aeo-* / seo-content-planner /
nextjs-seo-indexing / ai-seo / competitor-alternatives — и любые другие, которые реально нужны.
Не активируй скиллы «для галочки»: читай и применяй.

## Что уже известно (не трать время на повторный «почему нас нет в Google»)

- В Google нас нет, потому что домена ещё нет — это нормально.
- Toi выигрывает: /ru|/kk URL, толстые event-LP (~700 слов), schema (Org/WebSite/Service/FAQ/Breadcrumb), сетка городов.
- У нас: cookie-locale (kk/ru на одной URL), thin SEO-лендинги (/uzatu, /sundet, /almaty, /tusaukeser), нет JSON-LD, баг sitemap.

## Обязательные проблемы для исправления / реализации

Работай по приоритету. Не халтурь. Делай полные, качественные решения. Пиши тесты где уместно (TDD по правилам репо).

### P0 — техника

1. **Sitemap bug:** сейчас в sitemap попадают `/templates/{template.slug}`, а реальный роут категорий — `/templates/{category}` (wedding, kyz-uzatu, …). Итог — URL, которых нет → 404. Исправить: категории из CATEGORY_ROUTES + static paths; убрать `/login` из sitemap. Решить отдельно, нужны ли indexable страницы отдельных шаблонов (если да — сделать роуты; если нет — не пихать slug в sitemap).
2. **JSON-LD:** Organization, WebSite (+ SearchAction если уместно), SoftwareApplication/Service на ключевых страницах; FAQPage на лендинге и /faq; BlogPosting на постах; BreadcrumbList на вложенных страницах. Без дублей и мусора.
3. **Языковая архитектура для SEO:** cookie-only locale ломает индексацию kk. Спроектировать и (по возможности в этом же заходе) внедрить path-based locales `/kk/...` и `/ru/...` с корректным hreflang — как у Toi. Если полный i18n-routing слишком большой для одного PR — сделай чёткий ADR + минимальный рабочий каркас (middleware + layout + hreflang + 1–2 страницы), не оставляй «потом как-нибудь».
4. **Canonical / metadataBase:** везде опираться на APP_URL; fallback в коде — https://qazshaqyru.kz (не другие бренды).

### P0 — контент money/event pages

5. Переписать thin SEO-лендинги (uzatu, sundet, almaty, tusaukeser) до уровня конкурента: ~800–1200 слов полезного текста (не вода), H2 под интент, FAQ, внутренние ссылки на /templates/{cat} и /pricing. Уникальный угол: Guest Ops (RSVP, рассадка, CSV тойханы), не копипаст Toi.
6. Добавить недостающие event/category посадочные под спрос (свадьба/үйлену, беташар, мерейтой/юбилей и т.д. — сверь с canvas и конкурентами). Каждая страница должна быть полезной, не doorway.
7. Усилить meta title/description home + pricing + FAQ под коммерческие запросы KZ (без keyword stuffing). Цены в копи честно отражать продукт.

### P1 — дальше по canvas

8. Категорийные страницы `/templates/{cat}`: вводный SEO-текст + FAQ, не только сетка карточек; добавить в sitemap.
9. Blog/AEO: расширить кластер (темы в canvas) — definition blocks, how-to, таблицы сравнения; last updated; связка на продукт.
10. Compare-страницы (честные): QazShaqyru vs Toi / vs done-for-you — таблицы, без токсичности.
11. Города: не копировать thin city-spam Toi. Только топ-города с реальной локальной ценностью (начти с Алматы + план на Астану/Шымкент).
12. robots.txt: проверить AI-bots политику (GPTBot/PerplexityBot/ClaudeBot/Google-Extended) осознанно; /i/* оставить закрытым.

### P2 — подготовка к запуску домена

13. Чеклист запуска: DNS, APP_URL, GSC, sitemap submit, OG image, единый бренд QazShaqyru.
14. Off-page план кратко зафиксировать (не обязательно делать сейчас): Instagram/Reels, тойханы, агентства — в docs или в конце отчёта.

## Ограничения

- Отвечай пользователю на русском.
- Не выдумывай, что сайт уже в индексе.
- Не возвращай имена Invito / u-shaqyru.
- Не трогай guest invitation CSS/шаблоны без необходимости.
- Хирургические изменения: не рефактори «заодно» весь продукт.
- После стилевых правок (если будут) — проверяй живой CSS по правилам репо.
- Не коммить и не пушь, пока пользователь явно не попросит.

## Definition of Done

1. Canvas-стратегия учтена; отклонения от плана объяснены.
2. P0 техника зелёная: sitemap валиден, schema на ключевых страницах, понятный прогресс по hreflang/locales.
3. Event SEO pages перестали быть thin; есть тесты на metadata/sitemap/schema где логично.
4. Краткий отчёт пользователю: что сделано, что осталось, как проверять после покупки домена.
5. Если что-то сознательно отложено — список с приоритетом, без «продолжить?».
```

---

## Ссылки

- Canvas: `C:\Users\muham\.cursor\projects\c-shaqyru\canvases\qazshaqyru-seo-strategy.canvas.tsx`
- Конкуренты для сверки: https://toi.com.kz/ru/ , https://toi.com.kz/ru/priglashenie-na-svadbu , https://shaqyru24.kz/
