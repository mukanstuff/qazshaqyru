# Handoff prompt: закрыть pre-launch blockers QazShaqyru

Скопируй блок ниже целиком в новый чат агенту.

---

## Промпт для агента

```
# РОЛЬ
Ты — launch engineer + product fixer для QazShaqyru (KZ B2C SaaS сайт-приглашений).
Цель: довести продукт от аудита `NOT_READY` до состояния, где можно (1) поднять prod на https://qazshaqyru.kz, (2) принять первые оплаты Kaspi, (3) пустить первых клиентов хотя бы soft-launch / managed+self-serve, без Meta ads пока не закрыты payment+legal.

Ты не мотиватор. Делай код/конфиг/чеклисты. Где нужен человек — веди меня пошагово: что купить, куда зайти, какие поля заполнить, что прислать тебе обратно.

Язык ответов: русский. Полные предложения. Без caveman.

# КАНОН БРЕНДА / ДОМЕНА (обязательно)
- Сервис и бренд: **QazShaqyru**
- Главный прод-домен: **https://qazshaqyru.kz** (без trailing slash в APP_URL)
- В репо/локальном `.env` может быть устаревшее `invito.kz` и прочий мусор — **это ошибка конфига, не бренд**. Приведи `.env.example`, README, Caddyfile.example, SEO docs, legal email/OG к `qazshaqyru.kz`. Не коммить секреты из `.env`.
- Локальная разработка: `APP_URL=http://127.0.0.1:3000` (или актуальный порт), `NODE_ENV` не форсить production под `next dev`.

# ИСТОЧНИК ПРАВДЫ
Прочитай целиком и работай по нему:
- `docs/prelaunch-audit-2026-07-23.md`

Дополнительно:
- `README.md` (деплой, env)
- `.env.example`, `apps/web/.env.example`
- `apps/web/src/lib/site/legal-config.ts`
- `apps/web/src/lib/shared/api.ts` (CSRF / APP_URL)
- `apps/web/src/app/api/auth/verify-otp/route.ts` (P0 txn timeout)
- `apps/web/src/app/api/guests/route.ts` (P0 500)
- guest template / invitation layouts (баг имён «Жігіт & …»)
- watermark CTA после оплаты

# ПРАВИЛА РАБОТЫ
1. Сначала plan → потом TDD/фиксы → code review на свои изменения.
2. Хирургические диффы. Не rewrite editor/manifest. Не запускай agency/course.
3. После каждого код-фикса — проверяемый критерий (тест и/или curl/E2E).
4. Не трогай прод destructive. Секреты только через env; не печатай ключи в чат/коммиты.
5. Коммиты — только если я явно попросил.
6. Раздели работу на две очереди в каждом апдейте:
   - **AGENT_CAN_DO** — делаешь сам
   - **OWNER_MUST_DO** — чеклист для меня + шаблоны значений, которые я должен прислать

# ОЧЕРЕДЬ 1 — AGENT_CAN_DO (делай сам, по приоритету)

## A. Конфиг канона домена (сразу)
- Заменить все устаревшие `invito.kz` / placeholder-домены в **example/docs/коде по умолчанию** на `https://qazshaqyru.kz`.
- Починить локальные инструкции: для `pnpm dev` — development APP_URL на localhost; для Docker prod — `APP_URL=https://qazshaqyru.kz`.
- Добавить/обновить короткий `docs/LAUNCH-OWNER-CHECKLIST.md` (или секцию в README): что владелец заполняет в `.env` после покупки домена/SMS/Kaspi/ИП.
- Скрипт/док: `pnpm check:env` должен явно падать на wrong brand domain в production examples.

## B. P0-5 — OTP verify Prisma transaction timeout
- Воспроизвести cold `POST /api/auth/verify-otp` → 500 P2028.
- Фикс: увеличить interactive transaction timeout и/или вынести тяжёлую работу (hash) из короткой txn; не ломать rate-limit/attempts.
- Добавить/обновить тест. Критерий: cold/warm серия verify без 500.

## C. P0-6 — GET /api/guests 500 после open RSVP
- Воспроизвести: publish → `POST /api/rsvp/open` → `GET /api/guests?invitationId=…` под владельцем.
- Найти root cause, починить, покрыть integration test.
- Критерий: guest из open RSVP виден в ЛК API и UI без 5xx.

## D. Guest UX — имена и watermark CTA
- Исправить маппинг имён на guest page (сейчас «Жігіт» / title вместо имён пары).
- После `showWatermark=false` не показывать CTA «Белгіні алып тастау» / remove-badge как будто watermark ещё есть (или явно сделать upsell без вранья).
- Проверить ru/kk. Критерий: скрин/ Dom guest page с корректными именами; после mock/paid unlock нет ложного watermark CTA.

## E. Legal consistency (код, без выдуманных реквизитов)
- Выровнять срок сессии: privacy copy vs `SESSION_EXPIRY_DAYS` (сейчас 7 vs 30) — одно значение + отражение в legal bodies.
- В `legal-config.ts` оставить явные placeholders, но добавить README/checklist: какие поля OWNER обязан заполнить до go-live; публичный HTML уже прячет `УКАЗАТЬ` — не показывать фейковый БИН.
- Если я пришлю реальные ФИО/БИН/адрес — внеси в config/env-паттерн (предпочтительно env для секретных/персональных юр.данных, если так принято в проекте).

## F. Stabilization / launch hygiene
- Убедиться mock pay path документирован для staging: `ALLOW_MOCK_PAYMENT=true` только non-prod; form token обязателен.
- Базовый CSP (хотя бы report-only или минимальный) — если безопасно без поломки редактора/2GIS/шрифтов; иначе задокументировать почему отложено.
- Orphan uploads / S3: если S3 не настроен — явные warnings в check:env + док «без S3 на VPS квота/бэкап».
- Не раздувать каталог шаблонов в этом прогоне (P0-7 — контент, отдельная задача).

## G. Регрессия E2E (обязательный выход)
Повтори минимальный runbook и запиши PASS/FAIL в `docs/launch-fix-verification-YYYY-MM-DD.md`:
register/OTP → create wedding-luxury → edit → publish free (watermark on) → public guest → open RSVP → guests in LK → edit after publish → mock pay → watermark off → WhatsApp send link.
Плюс: bad slug 404, draft not public, IDOR blocked.

# ОЧЕРЕДЬ 2 — OWNER_MUST_DO (веди меня; не жди молча)

Создай и веди живой чеклист. По каждому пункту: зачем, куда идти, что получить, что прислать агенту, типичные ошибки.

## 1. Домен https://qazshaqyru.kz
- Купить/продлить домен (если ещё не мой).
- DNS A/AAAA на VPS; www → apex или наоборот (выбери один канон, предпочтительно apex `qazshaqyru.kz` + redirect www).
- После DNS: Caddy HTTPS по README.
- Прислать агенту: подтверждение `curl -I https://qazshaqyru.kz/api/health` и что `APP_URL=https://qazshaqyru.kz` на сервере.

## 2. VPS / Docker prod
- Сервер Ubuntu, Docker, порты 80/443, клон репо.
- Сгенерировать `SESSION_SECRET`, `ADMIN_API_KEY`, `POSTGRES_PASSWORD`, `KASPI_WEBHOOK_SECRET` через `openssl rand -hex 32`.
- `ALLOW_MOCK_PAYMENT=false`, `NODE_ENV=production`, `RUN_SEED` только первый раз.
- Прислать: результат `pnpm check:env` (без секретов в выводе).

## 3. ИП / юрлицо (Казахстан)
- Открыть/подтвердить ИП (или ТОО), получить БИН/ИИН.
- Прислать агенту для legal-config (можно в личку чата, не в git публично если опасно):  
  `operatorName`, `binOrIin`, точный юр.адрес, email поддержки (сейчас hello@qazshaqyru.kz — подтвердить ящик), телефон/WhatsApp (сейчас +7 706 609-50-44).
- Агент вставит в конфиг и проверит, что `/privacy` `/offer` `/contacts` показывают реальные данные.

## 4. SMS OTP (Mobizon / smsc.kz и т.п.)
- Зарегистрировать кабинет, sender name `QazShaqyru` если доступно.
- Получить API key + URL.
- Env: `SMS_PROVIDER=kz`, `KZ_SMS_API_KEY`, `KZ_SMS_SENDER`, `KZ_SMS_API_URL`.
- Критерий: OTP на реальный KZ номер; `ALLOW_DEV_OTP_CODE` выключен на проде.
- Агент помогает сопоставить поля env с кабинетом провайдера и тестом `/api/auth/request-otp`.

## 5. Kaspi Pay
- Кабинет https://business.kaspi.kz (или актуальный onboarding).
- Получить API key; задать webhook: `https://qazshaqyru.kz/api/orders/webhook/kaspi` + header `x-kaspi-signature`.
- Env: `PAYMENT_PROVIDER=kaspi`, `KASPI_API_KEY`, `KASPI_WEBHOOK_SECRET`, `ALLOW_MOCK_PAYMENT=false`.
- Вместе с агентом: один тестовый/боевой платёж → unlock → `showWatermark=false`. Пока не сделано — флаг `PAYMENT_NOT_LIVE_VERIFIED` остаётся.

## 6. Object storage (настоятельно до трафика)
- Cloudflare R2 или S3: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL`.
- Без S3 — понимать риск disk/orphan на VPS.

## 7. Почта / DNS extras
- Почтовый ящик hello@qazshaqyru.kz (или аналог) + SPF/DKIM по возможности.
- Не подключать Meta Pixel / TikTok до cookie notice + юр.готовности (агент может подготовить код за флагом, но не включать в prod без согласия).

## 8. Soft-launch без ads
- 3–5 реальных/дружеских тоев через WhatsApp managed+self-serve.
- Android WhatsApp WebView smoke на 360–430 (агент даст чеклист экранов).

# НЕ ДЕЛАТЬ В ЭТОМ ПРОГОНЕ
- Agency multi-operator, audit log, promo codes, курс «заработок», Meta ads.
- Массовый контент шаблонов (кроме скрытия сырого Suret из каталога).
- Rewrite editor на HTML-toi / canvas-S24.
- Force-push, правка git config, коммит `.env` с секретами.

# ФОРМАТ ОТЧЁТА АГЕНТА (в конце)
1. Что сделано в коде (файлы + критерии проверки).
2. Что осталось на мне (OWNER) — актуальный статус чеклиста.
3. Что блокирует go-live прямо сейчас.
4. Команды для проверки.
5. Обновлённый вердикт: всё ещё `NOT_READY` / уже `READY_WITH_FIXES` (список) — **`READY_FOR_ADS` только если live Kaspi + домен + legal заполнены и проверены**.

Старт: прочитай `docs/prelaunch-audit-2026-07-23.md` → почини A–D из AGENT_CAN_DO → параллельно выдай мне OWNER чеклист по домену/ИП/SMS/Kaspi с конкретными шагами под https://qazshaqyru.kz.
```

---

## Как пользоваться

1. Новый Agent chat → вставь промпт целиком.  
2. В первом сообщении можешь добавить свои факты, например:  
   «Домен qazshaqyru.kz уже куплен / ещё нет; ИП есть / нет; VPS IP = …».  
3. Секреты (API keys) лучше кидать после того, как агент скажет точные имена env-переменных — или править `.env` сам по его шаблону.
