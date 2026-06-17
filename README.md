# Invito

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
# Поднять Postgres
docker compose up -d postgres

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

### 1. Подготовка

```bash
# На VPS (Ubuntu 22.04+)
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER  # затем перелогиньтесь
```

### 2. Клонирование

```bash
git clone <repo>
cd shaqyru
cp apps/web/.env.example .env
# Заполните все CHANGE_ME_* в .env
nano .env
```

### 3. Деплой

```bash
chmod +x deploy.sh setup-vps.sh
./deploy.sh
```

`deploy.sh` сам:
1. Проверит, что все секреты заданы
2. Соберёт Docker-образы
3. Запустит Postgres, App, Caddy
4. Применит миграции
5. Засеет шаблоны
6. Сделает health-check

### 4. DNS

Укажите A-запись вашего домена на IP сервера. Caddy автоматически получит TLS-сертификат Let's Encrypt.

## Безопасность

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
