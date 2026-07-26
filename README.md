# QazShaqyru

> Цифровые приглашения для торжеств в Казахстане. Каталог готовых дизайнов с оплатой и отправкой в WhatsApp.

## Стек

- **Next.js 14** (App Router, Server Components, Edge middleware)
- **PostgreSQL 16** + **Prisma 5** (миграции)
- **Tailwind CSS** + shadcn/ui
- **TypeScript 5** (strict mode)
- **NextAuth-like custom auth**: phone + OTP через SMS
- **Docker Compose** + **Caddy** (автоматический HTTPS)
- **i18n**: казахский + русский (server-side cookies, без flash)

## Архитектура

```
apps/web/
├── prisma/
│   ├── schema.prisma           # User, Session, Invitation, Guest, Order, Template, RateLimitEntry
│   └── migrations/             # SQL-миграции (init + будущие)
├── src/
│   ├── app/                    # App Router (server components по умолчанию)
│   │   ├── (dashboard)/        # /dashboard, /invitations/* (защищено middleware)
│   │   ├── api/                # API routes
│   │   ├── i/[slug]/           # Публичная страница приглашения
│   │   └── layout.tsx          # Корень с AuthProvider + I18nProvider
│   ├── i18n/                   # Казахский + русский переводы (TS, без next-intl)
│   ├── lib/                    # Утилиты (auth, db, api, rate-limit, sms)
│   ├── hooks/                  # use-auth
│   ├── components/             # UI (shadcn/ui + custom)
│   └── middleware.ts           # Защита маршрутов + редирект локалей
├── public/                     # favicon, robots.txt
└── scripts/
    └── seed.ts                 # Сидинг шаблонов и админа
```

## Шаблоны приглашений: процессы

- `docs/HANDOFF_TEMPLATE_SYSTEM.md` — стратегический контекст, roadmap и ограничения.
- `docs/FIGMA_TEMPLATE_WORKFLOW.md` — правила подготовки шаблона в Figma и маппинг в `TemplateManifest`.
- `docs/AGENT_TEMPLATE_WORKFLOW.md` — конвейер работы агентов (архитектор → верстальщик → UX-критик) с анти-стагнацией.

## Быстрый старт (локально)

### 1. Требования

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose v2

### 2. Установка

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# Сгенерируйте SESSION_SECRET:
openssl rand -hex 32
# Вставьте в apps/web/.env
```

### 3. Запуск

```bash
# Поднять Postgres (порт 5432 на хосте — для pnpm dev)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

**Windows (PowerShell):** Docker Desktop должен быть запущен. Затем из корня репозитория:

```powershell
.\scripts\start-dev-db.ps1
cd apps\web
pnpm dev
```

Убедитесь, что в `apps/web/.env` строка `DATABASE_URL` указывает на **localhost:5432** (см. `.env.example`), а пароль совпадает с `POSTGRES_PASSWORD` в корневом `.env`.

```bash

# Применить миграции
cd apps/web
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Запустить dev-сервер
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой на VPS

Пошаговая инструкция для Ubuntu 22.04+ **без домена** (доступ по IP) и с доменом (HTTPS через Caddy).

### Что нужно подготовить заранее

| Что | Переменные | Где взять |
|-----|------------|-----------|
| **Kaspi Pay** | `KASPI_API_KEY`, `KASPI_WEBHOOK_SECRET`, `PAYMENT_PROVIDER=kaspi` | [business.kaspi.kz](https://business.kaspi.kz) |
| **SMS (OTP)** | `SMS_PROVIDER=kz`, `KZ_SMS_API_KEY`, `KZ_SMS_SENDER` | Mobizon, smsc.kz и т.п. |
| **Загрузки** | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL` | Cloudflare R2 или AWS S3 |
| **WhatsApp** | `WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | Ваш номер поддержки (только цифры) |
| **Админ (seed)** | `ADMIN_PHONE` | Номер администратора для OTP-входа в админку (при `RUN_SEED=true`) |
| **Секреты** | `SESSION_SECRET`, `ADMIN_API_KEY`, `POSTGRES_PASSWORD` | `openssl rand -hex 32` |

До получения ключей можно поднять staging: бесплатный шаблон `wedding-sage-minimal` публикуется без оплаты; OTP и Kaspi заработают после настройки провайдеров.

### 1. Подготовка сервера

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git openssl curl
sudo usermod -aG docker $USER   # перелогиньтесь
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Клонирование и переменные окружения

```bash
git clone <repo> && cd shaqyru
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Заполните `.env` в **корне репозитория** (Docker Compose читает его):

```bash
# Секреты
openssl rand -hex 32   # SESSION_SECRET, ADMIN_API_KEY, KASPI_WEBHOOK_SECRET
openssl rand -hex 32   # POSTGRES_PASSWORD

nano .env
```

Минимум для первого запуска **без домена**:

```env
APP_URL=http://YOUR.VPS.IP
NODE_ENV=production
SESSION_SECRET=<64 hex chars>
POSTGRES_PASSWORD=<strong password>
ADMIN_API_KEY=<64 hex chars>
TRUST_PROXY=true
ALLOW_MOCK_PAYMENT=false
RUN_SEED=true
RUN_MIGRATIONS=true
WHATSAPP_NUMBER=77001234567
NEXT_PUBLIC_WHATSAPP_NUMBER=77001234567
```

`apps/web/.env` — для локальной разработки; на VPS достаточно корневого `.env` (контейнер `app` получает переменные из compose).

### 3. Caddy: IP или домен

**Без домена (HTTP по IP):** скопируйте блок Option B из [`Caddyfile.example`](Caddyfile.example) в `Caddyfile`:

```caddy
:80 {
    reverse_proxy app:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {proxy_add_x_forwarded_for}
        header_up X-Forwarded-Proto {scheme}
    }
    encode gzip zstd
}
```

**С доменом (авто HTTPS):** оставьте текущий `Caddyfile` с `{$APP_URL}`, укажите `APP_URL=https://qazshaqyru.kz` (или ваш домен), добавьте A-запись DNS на IP VPS.

### 4. Проверка окружения перед деплоем

```bash
cd apps/web
pnpm install
set -a && source ../../.env && set +a   # bash; в PowerShell: dot-source вручную
pnpm check:env
```

Скрипт `check:env` прогоняет тот же чеклист, что и старт приложения (`src/lib/env.ts`). Ошибки — блокируют деплой; предупреждения — допустимы на staging.

PowerShell-вариант:

```powershell
Get-Content ..\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim().Trim('"'), 'Process')
}
pnpm check:env -- --env-file ../../.env
```

### 5. Запуск (Docker Compose)

```bash
cd /path/to/shaqyru
chmod +x deploy.sh
./deploy.sh
```

`deploy.sh` выполняет:

1. Проверку обязательных секретов в `.env`
2. `docker compose build`
3. `docker compose up -d` — Postgres → App → Caddy → cleanup
4. Миграции (`RUN_MIGRATIONS=true` в entrypoint)
5. Сид при `RUN_SEED=true` (только первый раз)
6. Health-check `GET /api/health`

Ручной запуск (эквивалент):

```bash
docker compose build
docker compose up -d
docker compose logs -f app
```

После первого успешного деплоя: `RUN_SEED=false` в `.env` и `docker compose up -d app`.

### 6. Миграции и seed вручную

```bash
docker compose exec app prisma migrate deploy --schema=./prisma/schema.prisma
docker compose exec app tsx scripts/seed.ts
```

### 7. Проверка

```bash
curl -s http://YOUR.VPS.IP/api/health
# {"status":"ok",...}
```

Откройте `http://YOUR.VPS.IP` в браузере. После покупки домена — см. Option A в `Caddyfile.example`.

Отдельный checklist для smoke-тестов после деплоя: [`DEPLOY_SMOKE_TEST.md`](DEPLOY_SMOKE_TEST.md).

### 8. Обслуживание

```bash
docker compose exec app pnpm cleanup          # очистка старых файлов
./scripts/backup-db.sh                        # бэкап Postgres
docker compose logs -f app caddy
```

### Переменные production (полный список)

См. [`.env.example`](.env.example) и [`apps/web/.env.example`](apps/web/.env.example).

| Группа | Переменные |
|--------|------------|
| База | `POSTGRES_*`, `DATABASE_URL` (в compose подставляется автоматически) |
| Приложение | `APP_URL`, `NODE_ENV`, `TRUST_PROXY` |
| Безопасность | `SESSION_SECRET`, `ADMIN_API_KEY` |
| OTP/SMS | `SMS_PROVIDER`, `KZ_SMS_*`, `TWILIO_*`, `OTP_*` |
| Оплата | `PAYMENT_PROVIDER`, `KASPI_*`, `FREEDOM_*`, `ALLOW_MOCK_PAYMENT=false` |
| Файлы | `S3_*`, `UPLOAD_DISK_QUOTA_MB` |
| Контакты | `WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| Docker | `RUN_MIGRATIONS`, `RUN_SEED`, `*_CONTAINER_NAME` |

**Важно:** `ALLOW_MOCK_PAYMENT=false` в production. Mock-оплата только для локальной разработки.

### 9. DNS (после покупки домена)

Укажите A-запись **qazshaqyru.kz** на IP сервера (www → redirect на apex). Caddy автоматически получит TLS Let's Encrypt. Обновите `APP_URL=https://qazshaqyru.kz` (без trailing slash) и переключите `Caddyfile` на Option A. Пошаговый чеклист владельца: [`docs/LAUNCH-OWNER-CHECKLIST.md`](docs/LAUNCH-OWNER-CHECKLIST.md).

## Платежи и SMS (production)

### Kaspi Pay
- `PAYMENT_PROVIDER=kaspi`
- `KASPI_API_KEY` — из [business.kaspi.kz](https://business.kaspi.kz)
- `KASPI_WEBHOOK_SECRET` — HMAC для webhook `POST /api/orders/webhook/kaspi` (заголовок `x-kaspi-signature`)
- В dev: `ALLOW_MOCK_PAYMENT=true` для mock-оплаты

### SMS (OTP)
- `SMS_PROVIDER` — `mock` (dev), `kz` (Mobizon/smsc.kz), `twilio`
- KZ: `KZ_SMS_API_KEY`, `KZ_SMS_SENDER`, `KZ_SMS_API_URL`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Freedom Pay (опционально)
- `FREEDOM_PAY_ENABLED=true` — только после проверки интеграции

Пока провайдеры не выбраны: **бесплатный шаблон** `wedding-sage-minimal` (0 ₸) можно опубликовать без оплаты.

## Загрузки файлов

- **Production (рекомендуется):** задайте `S3_*` переменные для Cloudflare R2 или AWS S3 — файлы сохраняются в object storage, публичный URL через `S3_PUBLIC_URL` (CDN).
- **Development / без S3:** файлы пишутся в `public/uploads/` на локальный диск.
- **Docker без S3:** volume `uploads_data` (`docker-compose.yml`). При деплое без Docker настройте постоянный каталог для `public/uploads/`.


- ✅ Сессии с HMAC-SHA256 (token хранится в БД как хэш)
- ✅ Rate-limit в БД (PostgreSQL), работает в мульти-инстанс режиме
- ✅ HttpOnly + Secure + SameSite=Lax cookies
- ✅ CSRF: проверка same-origin для state-changing запросов
- ✅ OTP: rate-limit на телефон и IP, блокировка после max attempts
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- ✅ PostgreSQL **не** торчит наружу (только в docker-сети)

## API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/auth/request-otp` | POST | Запрос OTP-кода |
| `/api/auth/verify-otp` | POST | Подтверждение OTP, выдача сессии |
| `/api/auth/logout` | POST | Выход |
| `/api/auth/session` | GET | Текущая сессия |
| `/api/users/me` | PATCH | Имя, язык |
| `/api/invitations` | GET, POST | Список/создание приглашений |
| `/api/invitations/[id]` | GET, PATCH, DELETE | Одно приглашение |
| `/api/invitations/[id]/send` | POST | Генерация ссылок для гостей |
| `/api/invitations/public/[slug]` | GET | Публичные данные |
| `/api/guests` | GET, POST, DELETE | Гости |
| `/api/rsvp` | GET, POST | Подтверждение/просмотр ответа |
| `/api/templates` | GET | Каталог шаблонов |
| `/api/og` | GET | OpenGraph-картинка для шеринга |
| `/api/invitations/[id]/checkout` | POST | Оплата и публикация |
| `/api/orders/pending` | GET | Ожидающие оплаты заказы |
| `/api/orders/[id]/sync` | POST | Синхронизация статуса с Kaspi/Freedom |
| `/api/orders/[id]/success` | GET | Redirect после оплаты |
| `/api/orders/webhook/[provider]` | POST | Webhook Kaspi или Freedom (`kaspi` / `freedom`) |
| `/api/orders/managed` | GET, POST | Заказы «сделаем за вас» (admin API key) |

## Переменные окружения

См. `apps/web/.env.example`. Все переменные обязательны.

## Ротация секретов

После утечки `SESSION_SECRET` немедленно:
```bash
openssl rand -hex 32  # новый секрет
# Обновите SESSION_SECRET в .env
./deploy.sh
```
Все существующие сессии будут автоматически аннулированы (HMAC не совпадёт).

## Лицензия

Proprietary.

## Что я бы проверил следующим шагом

- Реальный список незакрытых API и страниц после текущего MVP
- Бизнес-логику публикации приглашений и оплат
- Регистрируемые шаблоны, медиа-загрузки и публичную страницу приглашения
- Расхождения между страницами, API и Prisma-схемой
