# SEO launch checklist — QazShaqyru

Домен в проде ещё не куплен. Этот чеклист — что сделать в день подключения `qazshaqyru.kz` (или финального домена).

## DNS / infra

- [ ] Купить домен, DNS A/AAAA или CNAME на хостинг
- [ ] HTTPS (Let's Encrypt / Cloudflare)
- [ ] `APP_URL=https://qazshaqyru.kz` (без trailing slash) во всех env
- [ ] Проверить OG image: открыть `https://qazshaqyru.kz/api/og` (или статичный `/og.png` / favicon path из `site.ts`) в браузере и в [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) / аналоге
- [ ] **www ↔ apex:** выбрать один canonical host; второй — 301 на первый (Caddy/Cloudflare/host). Проверить оба URL отдают один host в canonical/hreflang
- [ ] 301 с любых временных хостов / preview URL на prod

## Search Console / Analytics

- [ ] Google Search Console: verify **Domain** property (DNS TXT) — предпочтительнее URL-prefix
- [ ] Отправить `https://qazshaqyru.kz/sitemap.xml`
- [ ] URL Inspection на `/`, `/pricing`, `/uzatu`, `/kk/uzatu`, `/ru/uzatu`, `/kk/sundet`
- [ ] Проверить в Inspection: canonical self на `/kk/…`, hreflang return tags видны
- [ ] GA4 (или аналог) + согласие cookie при необходимости

## Indexation smoke

- [ ] `robots.txt` отдаётся, Sitemap URL абсолютный на prod host
- [ ] Sitemap: нет `/login`, нет `/templates/{template.slug}`, есть `/templates/{category}`, есть `/kk/…` и `/ru/…` mirrors
- [ ] JSON-LD виден в View Source на home / FAQ / blog post / event LP
- [ ] Hreflang: kk-KZ / ru-KZ / x-default на money pages; self-ref совпадает с canonical
- [ ] Locale links: с `/kk/uzatu` клик «Цены» ведёт на `/kk/pricing` (не сбрасывает locale)
- [ ] Guest `/i/*` остаётся Disallow и без locale-prefix в UI

## IndexNow / ускорение (опционально)

- [ ] Если CDN/хостинг поддерживает IndexNow — отправить key + список money URLs после деплоя
- [ ] Иначе достаточно GSC URL Inspection + sitemap ping; не блокировать запуск ради IndexNow

## Brand

- [ ] Везде **QazShaqyru** (не старые имена)
- [ ] Title/description home + pricing коммерческие, цены честные (Standard от 3 990 ₸)

## Off-page (параллельно SEO)

### Ближайшие next actions

1. 5–10 Instagram/Reels: «собрали шақыру за 60 сек» + ссылка в bio на `/` или `/templates`
2. Список 10 тойхан / ведущих → предложение guest-портала CSV + backlink на `/agency` или кейс
3. 1 гостевой пост / ответ в wedding Telegram без спама со ссылкой на how-to блог
4. Сбор 3 отзывов со скринами RSVP/CSV для LP (E-E-A-T)

### Каналы (кратко)

- Instagram / TikTok Reels
- Партнёрства: тойханы, ведущие, агентства
- 2GIS / Kaspi упоминания, wedding-медиа KZ
- Отзывы со скринами

## Города (content)

- [x] Алматы `/almaty` — локальный сценарий тойханы (+ уникальный kk `/kk/almaty`)
- [x] Астана `/astana` (+ `/kk/astana`)
- [ ] Шымкент — **не публиковать thin**; brief: `docs/SHYMKENT-CONTENT-BRIEF.md`
- [ ] Караганда / Актобе — после кейсов, не ради сетки

## Path locales / LocaleLink (код — закрыто 2026-07-19)

- [x] Middleware `/kk`|`/ru` + legacy `/kz`→308
- [x] LocaleLink на marketing surfaces (home Landing*, templates, blog, FAQ, footers)
- [x] Уникальный kk HTML на всех 8 event/city LP
- [x] Soft Accept-Language banner (без hard redirect)
- [x] Category kk intro на money cats
- [ ] Full `app/[locale]` — phase 2 (не блокер запуска)

## Блог-кластер (canvas 12 тем)

Статус на 2026-07-19: 12/12 тем закрыты (ru+kz), включая betashar-kudalyk, tusaukeser-text, kaspi-payment-refund, honest-comparison.

## Не делать

- Не индексировать `/i/*` (оставить Disallow)
- Не плодить thin city-spam (только топ-города с локальной ценностью)
- Не ждать индексации до покупки домена — её и не будет
- Не создавать indexable `/templates/{slug}` без отдельного product-решения (см. ADR-003)
- Не hard-redirect по Accept-Language (soft banner уже есть)
