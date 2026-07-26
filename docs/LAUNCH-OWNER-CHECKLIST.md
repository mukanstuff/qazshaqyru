# Launch owner checklist — QazShaqyru

Канон: бренд **QazShaqyru**, прод-домен **`https://qazshaqyru.kz`** (без trailing slash в `APP_URL`).  
`invito.kz` в любом `.env` — ошибка конфига, не бренд.

Агент правит код/examples. Ниже — только то, что делает **владелец**. После каждого блока пришлите агенту указанные артефакты (без секретов в git).

---

## 0. Локально vs prod (не путать)

| Режим | `NODE_ENV` | `APP_URL` | Mock pay / SMS |
|--------|------------|-----------|----------------|
| `pnpm dev` | `development` | `http://127.0.0.1:3000` (или ваш порт) | `SMS_PROVIDER=mock`, `ALLOW_MOCK_PAYMENT=true` ок |
| Docker prod | `production` | `https://qazshaqyru.kz` | `SMS_PROVIDER=kz`, `ALLOW_MOCK_PAYMENT=false` |

Проверка перед деплоем:

```powershell
cd apps/web
pnpm check:env -- --env-file ../../.env
```

Скрипт **падает**, если `APP_URL=https://invito.kz` (obsolete brand).

---

## 1. Домен `qazshaqyru.kz`

**Зачем:** HTTPS, CSRF/`APP_URL`, webhook Kaspi, canonical/OG.

1. Купить/продлить домен у регистратора (.kz).
2. DNS:
   - **A** `qazshaqyru.kz` → публичный IP VPS
   - **www** → redirect/CNAME на apex (канон = apex)
3. На сервере в `.env`: `APP_URL=https://qazshaqyru.kz`
4. Caddy Option A из `Caddyfile.example` → TLS Let's Encrypt
5. Прислать агенту:
   - вывод `curl -I https://qazshaqyru.kz/api/health` (ожидаем 200)
   - подтверждение, что на сервере `APP_URL=https://qazshaqyru.kz` (без секретов)

**Типичные ошибки:** trailing slash в `APP_URL`; www как канон без redirect; DNS ещё не пророс, а Caddy уже ждут.

---

## 2. VPS + Docker

**Зачем:** хостинг приложения + Postgres + Caddy.

1. Ubuntu VPS, открыть 80/443, установить Docker + Compose.
2. Клон репо, `cp .env.example .env`.
3. Сгенерировать и вставить:

```bash
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 32   # ADMIN_API_KEY
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 32   # KASPI_WEBHOOK_SECRET
```

4. Обязательно: `NODE_ENV=production`, `TRUST_PROXY=true`, `ALLOW_MOCK_PAYMENT=false`, `RUN_SEED=true` только первый раз.
5. Прислать: результат `pnpm check:env` (можно замазать ключи `***`).

---

## 3. ИП / юрлицо (Казахстан)

**Зачем:** оферта/privacy без плейсхолдеров; ads policy; претензии.

1. Открыть/подтвердить ИП (или ТОО), получить БИН/ИИН.
2. Прислать агенту в чат (не обязательно в публичный git):

```text
operatorName=ИП Иванов Иван Иванович
binOrIin=123456789012
address=г. Алматы, ул. …, офис …
email=hello@qazshaqyru.kz   # подтвердить, что ящик ваш
phone=+7 706 609-50-44      # или новый WhatsApp
```

3. Агент вставит в `legal-config` / env-паттерн и проверит `/privacy` `/offer` `/contacts` — без «УКАЗАТЬ».

---

## 4. SMS OTP (KZ)

**Зачем:** без боевого SMS на проде регистрация → 503.

Рекомендуемые провайдеры (любой один):

| Провайдер | Кабинет | Примечание |
|-----------|---------|------------|
| **Mobizon** | https://mobizon.kz | В `.env.example` уже URL API |
| **smsc.kz** | https://smsc.kz | Другой `KZ_SMS_API_URL` — сверить с докой |

Шаги:

1. Регистрация кабинета, пополнить баланс.
2. Sender name `QazShaqyru` (если доступно; иначе временный одобренный sender).
3. Env:

```env
SMS_PROVIDER=kz
KZ_SMS_API_KEY=<из кабинета>
KZ_SMS_SENDER=QazShaqyru
KZ_SMS_API_URL=https://api.mobizon.kz/service/message/sendsmsmessage
```

4. На проде: `ALLOW_DEV_OTP_CODE` **выключен**.
5. Критерий: OTP на реальный KZ-номер; прислать агенту «OTP пришёл / не пришёл» + HTTP-код `POST /api/auth/request-otp` (без кода из SMS в чат, если не нужно дебажить).

---

## 5. Kaspi Pay

**Зачем:** снятие watermark, live деньги. Без этого вердикт не выше `READY_WITH_FIXES` / не `READY_FOR_ADS`.

1. Кабинет: https://business.kaspi.kz (актуальный onboarding у Kaspi).
2. Получить API key.
3. Webhook:
   - URL: `https://qazshaqyru.kz/api/orders/webhook/kaspi`
   - Header: `x-kaspi-signature` (HMAC-SHA256 тела с `KASPI_WEBHOOK_SECRET`)
4. Env:

```env
PAYMENT_PROVIDER=kaspi
KASPI_API_KEY=<из кабинета>
KASPI_WEBHOOK_SECRET=<openssl rand -hex 32>
ALLOW_MOCK_PAYMENT=false
```

5. Вместе с агентом: один тестовый/боевой платёж → unlock → `showWatermark=false` на public API.
6. Пока не сделано — флаг аудита `PAYMENT_NOT_LIVE_VERIFIED` остаётся.

**Staging mock (только non-prod):** `ALLOW_MOCK_PAYMENT=true` + form `token` на `/mock-payment`. На проде mock запрещён.

---

## 6. Object storage (настоятельно до трафика)

```env
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=https://cdn.qazshaqyru.kz
```

Без S3: uploads на диск VPS (`UPLOAD_DISK_QUOTA_MB`), риск orphan/бэкапа. `check:env` предупредит.

---

## 7. Почта / DNS extras

1. Ящик `hello@qazshaqyru.kz` (или аналог) + по возможности SPF/DKIM.
2. **Не** подключать Meta Pixel / TikTok до cookie notice + заполненного юрлица.

---

## 8. Soft-launch без ads

1. 3–5 реальных/дружеских тоев через WhatsApp (managed + self-serve под контролем).
2. Android WhatsApp WebView smoke 360–430: envelope → имена → карта → RSVP → watermark off после оплаты.

---

## Статус (владелец заполняет)

| # | Пункт | Статус |
|---|--------|--------|
| 1 | Домен + DNS + HTTPS | ☐ нет / ☐ купил / ☐ health 200 |
| 2 | VPS + Docker + secrets | ☐ |
| 3 | ИП + БИН в legal | ☐ |
| 4 | SMS kz live OTP | ☐ |
| 5 | Kaspi live pay → unlock | ☐ `PAYMENT_NOT_LIVE_VERIFIED` |
| 6 | S3/R2 | ☐ optional warn |
| 7 | Почта hello@ | ☐ |
| 8 | Soft-launch 3–5 тоев | ☐ |

**Go-live ads:** только когда 1–5 закрыты и проверены.
