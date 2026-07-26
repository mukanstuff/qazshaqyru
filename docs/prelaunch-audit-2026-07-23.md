# Pre-launch audit — QazShaqyru

**Дата:** 2026-07-23  
**Роль:** pre-launch auditor / product-QA lead  
**Бренд в продукте:** QazShaqyru (README, `<title>`, footer, legal). В docs/env фигурирует `qazshaqyru.kz`; в локальном `apps/web/.env` ошибочно `APP_URL=https://invito.kz`. Live DNS `qazshaqyru.kz` и `invito.kz` на момент аудита **не резолвятся**.  
**Окружение:** локальный Next.js `http://127.0.0.1:3000` / audit `http://127.0.0.1:3001` + Docker Postgres `invitation_db`. Staging/prod HTTPS отсутствует.

---

## 0. Executive verdict

### `NOT_READY`

| Вопрос | Ответ |
|--------|--------|
| Лить платную рекламу Meta/TikTok/Google? | **Нет.** Нет боевого домена/HTTPS; live Kaspi не проверен (`PAYMENT_NOT_LIVE_VERIFIED`); юрлицо/БИН в source — плейсхолдеры; конверсионных пикселей в коде нет. |
| Пускать первых платящих клиентов self-serve? | **Рано для unsupervised self-serve.** Цикл create→publish→guest→RSVP→mock-unlock в целом доказан, но SMS/Kaspi/домен/юридика и стабильность ЛК не готовы к бою. Допустимы только **ручные** заказы через WhatsApp с контролем оператора. |
| Agency / курс «заработок на приглашениях»? | **Рано.** Есть страница тарифа; нет multi-operator, audit log, partner docs, промокодов. |

**Блокеры до любой рекламы:** live HTTPS + реальные реквизиты + live Kaspi E2E + SMS prod + стабильный guest→RSVP→ЛК без 5xx/таймаутов auth.

---

## 1. Scorecard A–L

| Область | Score | Одна фраза |
|---------|------:|------------|
| A. Prod/host | 4/10 | Docker/CI/health есть; домена нет; `.env` боевой-ломаный; Sentry нет; cold-start хрупкий. |
| B. Legal/trust | 4/10 | privacy/terms/offer/refund/contacts живые; БИН/ИП — плейсхолдеры в `legal-config.ts`. |
| C. Marketing honesty | 6/10 | Watermark и 3 990 ₸ заявлены честно; «5 минут» и «гости видно» переоценены. |
| D. Auth | 6/10 | OTP + rate-limit + CSRF origin в prod; verify падает на Prisma txn timeout при cold compile. |
| E. Happy-path | 6/10 | Create→edit→publish→public→open RSVP→mock unlock пройдены; GET guests давал 500; UI имён ломается. |
| F. Guest/mobile | 6/10 | Envelope/карта/RSVP/музыка есть; клип имён; CTA watermark после оплаты ещё в DOM. |
| G. Ops | 5/10 | Seating/export/gifts/restaurant в коде; guest list API нестабилен в прогоне. |
| H. Editor/model | 7/10 | Manifest/sections + LiveEditor — здраво; нет immutable publish snapshot. |
| I. Payments | 4/10 | Mock unlock доказан; live Kaspi не проверен. |
| J. Security | 6/10 | Ownership/IDOR базово ок; CSP нет; captcha stub; `.env` с CHANGE_ME и wrong APP_URL. |
| K. Launch-techdebt | 5/10 | Тесты auth/publish/RSVP/payment есть; SPOF — один Next + disk uploads. |
| L. Agency/course | 2/10 | Тариф есть; org/audit/promo/course ops — нет. |

---

## 2. Blockers P0

### P0-1. Нет боевого домена / HTTPS / корректного `APP_URL`
- **Проблема:** `https://qazshaqyru.kz` и `https://invito.kz` не резолвятся. В `apps/web/.env`: `APP_URL="https://invito.kz"`. CSRF в production сравнивает Origin с host из `APP_URL`.
- **Доказательство:** DNS fail; `.env` строки Application; `checkSameOrigin` в `apps/web/src/lib/shared/api.ts`.
- **Импакт:** нельзя рекламировать, нельзя webhook Kaspi, Secure cookie/canonical/OG.
- **Проверка фикса:** `nslookup` + `curl -I https://<domain>/api/health` → 200; `APP_URL` совпадает с host; `pnpm check:env` без errors.
- **Effort:** M.

### P0-2. `PAYMENT_NOT_LIVE_VERIFIED` — live Kaspi не пройден
- **Проблема:** `KASPI_API_KEY=""`; mock path доказан только с `ALLOW_MOCK_PAYMENT=true` + form `token`.
- **Доказательство:** Order `313236b8-7291-40f5-9d34-b74b9d19d54e` → `paid` / `paymentProvider=mock` / invitation `unlockedPlanSku=standard`; live ключей нет.
- **Импакт:** по правилу аудита нельзя `READY_FOR_ADS`.
- **Проверка фикса:** один реальный платёж staging → webhook HMAC ok → `unlockedPlanSku` + `showWatermark=false` на public API.
- **Effort:** M.

### P0-3. Юрлицо / БИН — плейсхолдеры
- **Проблема:** `SITE_LEGAL.operatorName = 'ИП [УКАЗАТЬ ФИО]'`, `binOrIin = '[УКАЗАТЬ БИН/ИИН]'` в `apps/web/src/lib/site/legal-config.ts`. Публичный HTML плейсхолдеры прячет, но оферта без реального оператора.
- **Доказательство:** legal-config; HTML `/privacy` `/contacts`: `placeholder=False`, `bin=False`, phone/email присутствуют.
- **Импакт:** ads policy / потребительские претензии.
- **Проверка фикса:** в HTML legal видны реальные ФИО/БИН; нет маркеров `УКАЗАТЬ`.
- **Effort:** S (+ юр.ревью).

### P0-4. SMS prod не готов
- **Проблема:** `SMS_PROVIDER=mock` недопустим при `NODE_ENV=production` (`isSmsProviderReady`).
- **Доказательство:** `.env` + `apps/web/src/lib/shared/sms.ts`.
- **Импакт:** регистрация на проде → 503.
- **Проверка фикса:** OTP на реальный KZ-номер; `SMS_PROVIDER=kz` + ключ; mock выключен.
- **Effort:** S–M.

### P0-5. Auth verify OTP падает на cold start (Prisma txn 5s)
- **Проблема:** Первый `POST /api/auth/verify-otp` после compile → 500 `P2028 Transaction already closed`.
- **Доказательство:** лог Next: timeout 5371 ms; HTTP 500.
- **Импакт:** вход «мёртвый» под cold/slow DB; риск при пике.
- **Проверка фикса:** cold restart → серия verify без 500; увеличить txn timeout / вынести hashing из txn.
- **Effort:** S–M.

### P0-6. Guest list в ЛК ненадёжен в прогоне
- **Проблема:** После open RSVP `GET /api/guests?invitationId=…` вернул **500** при сессии. Guest при этом есть в БД и в `POST …/send`.
- **Доказательство:** open RSVP 200 → `Guest Audit` / `attending` в Postgres; GET guests 500; send вернул guest + `whatsappLink`.
- **Импакт:** claim «кто придёт — видно» ломается в кабинете.
- **Проверка фикса:** после RSVP UI guests без 5xx; интеграционный тест зелёный в CI.
- **Effort:** M.

### P0-7 (рост каталога, не блокер одного тоя)
- Active templates: `wedding-luxury`. В БД ~40 inactive.
- **Effort:** L (контент). Не считать провалом цикла.

---

## 3. Claim vs Reality

| Заявлено | Где | В продукте? | E2E |
|----------|-----|-------------|-----|
| QazShaqyru, той за 5 минут | Landing `/` | Да, copy | API-создание быстро; полный UI с фото/музыкой для новичка ≠ 5 мин. Гипероль. |
| Создание бесплатно, без логотипа от 3 990 ₸ | Hero / pricing / FAQ | Да, `PLAN_CATALOG.standard=3990` | Free publish → `showWatermark=true`; mock pay → `false` + unlock `standard`. |
| RSVP / «кто придёт видно» | Landing | Open RSVP + personal links | Open RSVP **PASS**; GET guests в ЛК — **FAIL 500** в прогоне; данные в БД есть. |
| Kaspi | Landing / legal | Код Kaspi+HMAC есть | Live **NOT_VERIFIED**; mock **PASS**. |
| Карта / 2GIS | Product | `mapUrl` + «Картаны ашу» | PASS на guest page. |
| Музыка | Product | Upload + UI | UI есть; binary upload в прогоне **NOT_VERIFIED**. |
| Agency 9 990 ₸/мес | `/agency` | Checkout route есть | Live agency pay **NOT_VERIFIED**; multi-user **нет**. |
| Контакты +7 (706) 609-50-44, hello@qazshaqyru.kz | Footer / contacts | Да | PASS в HTML. |
| «N клиентов» / гарантии дохода | — | У нас на лендинге нет | Плюс (не врим числом). |

---

## 4. E2E runbook (организатор)

Среда: `http://127.0.0.1:3001`, `ALLOW_MOCK_PAYMENT=true`, `SMS_PROVIDER=mock`, Postgres up.

| Шаг | Результат | Комментарий |
|-----|-----------|-------------|
| Health | **PASS** | `{"status":"ok","database":"up"}` |
| Register/login OTP | **PASS** с прогревом; **FAIL** cold | `devCode`; cold verify → 500 txn |
| Templates | **PASS** | 2 active; `wedding-luxury` |
| Create draft | **PASS** | Нужны `title,eventType,eventDate,templateId,templateKey` |
| Edit (место, 2GIS, текст, время) | **PASS** | `Rixos Almaty`, mapUrl 2gis |
| Publish free | **PASS** | `published:true`, `needsPayment:true`, `amountKzt:3990` |
| Public guest | **PASS** | `/i/8TK4_Dtauo-audit-wedding` 200; envelope → контент |
| Guest open RSVP | **PASS** | `POST /api/rsvp/open` → attending |
| RSVP видно в ЛК | **PARTIAL FAIL** | БД + send видят guest; `GET /api/guests` → 500 |
| Edit after publish | **PASS** | place → `Rixos Almaty Hall A` на public API |
| Checkout mock | **PASS** | `/mock-payment?orderId=…&token=mock_…` |
| Mock unlock | **PASS** | Form POST token → paid; `unlockedPlanSku=standard`; `showWatermark=false` |
| WhatsApp share | **PASS** | `POST …/send` → `whatsappLink` + `?guest=` |
| Bad slug | **PASS** | 404 |
| Draft public | **PASS** | public API draft → 404 |
| IDOR чужого id | **PASS** | другой user → 404 |
| Upload photo/music | **NOT_VERIFIED** | файл не грузили |
| Live Kaspi | **PAYMENT_NOT_LIVE_VERIFIED** | — |

Артефакты: invitation `4877a167-2280-40a9-a925-7373d1d17fa7`, slug `8TK4_Dtauo-audit-wedding`, order `313236b8-7291-40f5-9d34-b74b9d19d54e`.

---

## 5. Guest + Mobile

Browser automation: контент guest — mobile column. Отдельная device-emulation 360/390/430 и Android WhatsApp WebView — **частично / NOT_VERIFIED** для WebView.

Факты:
- Envelope «АШУ ҮШІН БАСЫҢЫЗ» работает.
- После открытия: календарь, countdown, адрес, карта, RSVP, wishes, music controls.
- Баг имён: «Жігіт» / «Audit Wedding» вместо осмысленных имён пары — UX-смерть первого экрана гостя.
- CTA «Белгіні алып тастау» остаётся в DOM после оплаты (`showWatermark=false`) — путаница.
- Locale kk на guest; `/i/*` noindex в `next.config.js` — верно.
- `/i/demo` живой; при перегрузке сервера — долгий loading / abort (риск WebView timeout).

---

## 6. Security & Legal

### Security

| Sev | Finding | Evidence |
|-----|---------|----------|
| HIGH | Prod env gaps: empty Kaspi, mock SMS, wrong APP_URL, SESSION_SECRET=CHANGE_ME… | `.env` |
| HIGH | OTP verify txn timeout → 500 | Server log P2028 |
| MEDIUM | Нет CSP | `next.config.js` |
| MEDIUM | Captcha stub | `.env` + routes |
| MEDIUM | Disk uploads без S3 | S3_* пустые |
| MEDIUM | Public invite отдаёт event PII by design | public API; mitigated noindex |
| LOW | IDOR invitation — 404 | cross-user GET |
| LOW | Open redirect sanitized | `lib/shared/redirect.ts` |
| LOW | Upload: no SVG; magic bytes | upload routes |
| LOW | Mock pay locked off без флага | `mock-payment-guard.ts` |
| — | Hardcoded live secrets в `src/` | не найдены; `.gitignore` покрывает `.env*` |
| — | XSS `dangerouslySetInnerHTML` | не найден на просмотренном guest path |

Критичных auth-bypass / RCE в просмотренном коде не найдено. Метод: код-ревью + API smoke, без эксплойтов.

### Legal

- `/privacy`, `/terms`, `/offer`, `/refund`, `/contacts` — **200**, ссылки в footer.
- ПДн/RSVP/cookies/платежи описаны в `content/legal/bodies.tsx`.
- Возвраты: цифровая услуга обычно без возврата; исключения до 10 рабочих дней.
- Privacy: session ~7 дней vs код `SESSION_EXPIRY_DAYS=30` — противоречие.
- Cookie consent: нет (пикселей в src тоже нет — сейчас ок; при Meta Pixel — обязателен).
- `/agency`: без гарантий дохода (хорошо). Курс обучения в оферте не оформлен.

---

## 7. Editor vs competitors

| | toi.com.kz | shaqyru24.kz | shaqyru.kz (Peaksoft) | bizdetoi / online-shaqyru | QazShaqyru |
|--|------------|--------------|------------------------|---------------------------|------------|
| Модель | Self-serve, pay to activate | Self-serve, 100+ tpl | Managed/wizard | Managed WA/IG «15 мин» | Self-serve + agency SKU |
| Editor | Template fill / live page | Canvas/template heavy | Меньше self-serve | Нет editor у клиента | Manifest/sections + LiveEditor |
| До ссылки | Сильный каталог | Быстро с телефона | Через менеджера | 15 мин руками | Технически быстро; каталог узкий |
| Guest | Зрелый mobile | Personal per guest | Classic sites | Custom landing | Envelope+RSVP+map; баг имён |
| Ops | RSVP + agency 10k | RSVP/лайки/gifts | Телефон | Таблица ответов | Seating/CSV/restaurant/gifts в коде |
| Trust | Объём + цены от 2990 | Крупные social claims | Peaksoft + телефон | WA-first | Phone/email ок; юрлицо пустое |
| Цена | Free/2990/4990/VIP/10k | «доступная» | Custom | ~4900 managed | Free WM / 3990 / 4990 / 9990 |

**Вывод:** editor не выкидывать. Проигрыш — каталог, live ops polish, домен/оплата/trust. Не копировать HTML-toi wholesale.

---

## 8. Agency / Course readiness

| Компонент | Статус |
|-----------|--------|
| `/agency` + 9990 | ok (marketing) |
| Agency checkout API | ok (код) |
| Watermark off via paid | ok (mock доказан) |
| Multi-operator / workspace | **missing** |
| Audit log | **missing** |
| Promo codes | **missing** |
| Partner SOP «15 мин» | **missing** |
| Course / income legal | **missing** (и правильно не обещать) |

**MUST before partner:** юрлицо, live pay, изоляция клиентов, branding SLA, refund/access для agency, запрет гарантий дохода, support SLA, ≥N шаблонов, abuse kill-switch.

---

## 9. Delete / replace / simplify

1. **Не переписывать** editor/manifest.
2. **Чистка** устаревших и неиспользуемых файлов.
3. **Упростить** onboarding до toi-like: один путь до ссылки.
4. **Ops** (рассадка/CSV/restaurant) — в paid, не в free first-run.
5. **Не чинить до 5–10 оплат:** white-label, AI fill, Freedom Pay, multi-city SEO polish.
6. **Заменить перед масштабом:** disk → S3/R2; добавить Sentry; починить guests 500.
7. **Починить имена** на guest template до любой рекламы.

---

## 10. 14-day launch plan

**Дни 1–3:** домен + HTTPS + `APP_URL`; заполнить `SITE_LEGAL`; SMS kz; `ALLOW_MOCK_PAYMENT=false` на проде; Kaspi keys + webhook.  
**Дни 4–6:** staging live Kaspi pay→unlock; починить guests 500 + OTP txn; починить имена на guest.  
**Дни 7–9:** 3–5 дружеских тоев через WA (managed); Android WhatsApp WebView check; S3 + uptime + (желательно) Sentry.  
**Дни 10–14:** Pixel + cookie notice только если нужна реклама; креативы с реальным demo-slug; ads **только после** закрытия P0-1…P0-6. Agency/course — не запускать.

---

## 11. Appendix

### URLs
- Local: `http://127.0.0.1:3000`, `http://127.0.0.1:3001`
- Invite: `http://127.0.0.1:3001/i/8TK4_Dtauo-audit-wedding`
- Demo: `http://127.0.0.1:3001/i/demo`
- Legal: `/privacy` `/terms` `/offer` `/refund` `/contacts` `/pricing` `/agency`
- Competitors: https://toi.com.kz/ru/ , https://shaqyru24.kz/ru/home , https://shaqyru.kz/go , https://bizdetoi.kz/ , https://online-shaqyru.kz/ru/
- Prod domain: **DOWN**

### Команды
```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
cd apps/web
$env:ALLOW_MOCK_PAYMENT='true'; $env:SMS_PROVIDER='mock'; $env:APP_URL='http://127.0.0.1:3001'
pnpm exec next dev --port 3001
```

### Env gaps (prod)
`APP_URL` (реальный https), `SESSION_SECRET` (не CHANGE_ME), `SMS_PROVIDER=kz` + `KZ_SMS_API_KEY`, `KASPI_API_KEY` + `KASPI_WEBHOOK_SECRET`, `ALLOW_MOCK_PAYMENT=false`, S3_* (рекомендовано), captcha ≠ stub при росте abuse, Sentry (нет).

### NOT_VERIFIED
Live Kaspi E2E; Android WhatsApp WebView; upload photo/music binary в UI; agency live pay; полный seating/CSV/restaurant UI руками; глубокий Peaksoft editor.

### PAYMENT_NOT_LIVE_VERIFIED
Live Kaspi не оплачивался. Mock: order paid → `unlockedPlanSku=standard` → `showWatermark=false`.

### Карта маршрутов
`/`, `/templates`, `/pricing`, `/login`, `/dashboard`, `/invitations/*`, `/i/[slug]`, `/r/[token]`, `/agency`, `/blog`, legal, `/api/health`, `/api/auth/*`, `/api/invitations/*`, `/api/rsvp`, `/api/rsvp/open`, `/api/guests`, `/api/orders/*`, `/mock-payment`.

---

*Вердикт: `NOT_READY` для ads и unsupervised paid launch. Технический скелет self-serve пригоден после закрытия P0-1…P0-6.*
