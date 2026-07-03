# Invito — Launch Checklist (production & credentials)

> **Prep document only.** Replace placeholders with your real assets and secrets before production launch.
> Do not commit `.env` with real keys.

---

## Quick: what you must provide

| Item | Env vars | Where to get |
|------|----------|--------------|
| **Domain** | `APP_URL=https://your.domain` | Registrar + DNS A → VPS IP |
| **Kaspi Pay** | `KASPI_API_KEY`, `KASPI_WEBHOOK_SECRET`, `PAYMENT_PROVIDER=kaspi` | [business.kaspi.kz](https://business.kaspi.kz) |
| **KZ SMS (OTP)** | `SMS_PROVIDER=kz`, `KZ_SMS_API_KEY`, `KZ_SMS_SENDER` | Mobizon, smsc.kz |
| **Uploads (recommended)** | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL` | Cloudflare R2 or AWS S3 |
| **Scheduler** | `RECONCILE_INTERVAL_SEC`, `CLEANUP_INTERVAL_SEC` | docker `scheduler` service (auto) |
| **Captcha (pre-launch)** | `CAPTCHA_PROVIDER`, `TURNSTILE_*` or `HCAPTCHA_*` | See `docs/CAPTCHA_SPEC.md` |
| **Secrets** | `SESSION_SECRET`, `ADMIN_API_KEY`, `POSTGRES_PASSWORD` | `openssl rand -hex 32` |
| **Support** | `WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your business WhatsApp (digits only) |

Run before deploy:

```bash
cd apps/web && NODE_ENV=production pnpm check:env -- --env-file ../../.env
```

---

## 1. Environment variables

Copy root `.env.example` → `.env` (Docker) and `apps/web/.env.example` → `apps/web/.env` (local dev).

### Kaspi Pay (real payments)

```env
PAYMENT_PROVIDER=kaspi
ALLOW_MOCK_PAYMENT=false
KASPI_API_KEY=<from Kaspi Business>
KASPI_API_URL=https://pay.kaspi.kz/api/v1
KASPI_WEBHOOK_SECRET=<openssl rand -hex 32>
```

**Webhook registration** (in Kaspi Business dashboard):

| Field | Value |
|-------|--------|
| URL | `POST {APP_URL}/api/orders/webhook/kaspi` |
| Signature header | `x-kaspi-signature` (HMAC-SHA256 of raw body) |
| Secret | Same value as `KASPI_WEBHOOK_SECRET` in `.env` |

Without `KASPI_API_KEY`, checkout returns **503** `payment_not_configured`.  
Without `KASPI_WEBHOOK_SECRET`, payments may complete at Kaspi but orders stay `pending` until manual sync.

### KZ SMS (OTP on phone)

```env
SMS_PROVIDER=kz
KZ_SMS_API_KEY=<Mobizon / smsc.kz API key>
KZ_SMS_SENDER=Invito
# KZ_SMS_API_URL=<only if non-Mobizon endpoint>
```

Use `SMS_PROVIDER=mock` + `ALLOW_DEV_OTP_CODE=true` **only** for local dev.

### S3 / R2 (durable uploads on VPS)

```env
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_BUCKET=invito-uploads
S3_ACCESS_KEY=<key>
S3_SECRET_KEY=<secret>
S3_REGION=auto
S3_PUBLIC_URL=https://cdn.yourdomain.kz
```

Without all five `S3_*` vars, uploads use local Docker volume (`UPLOAD_DISK_QUOTA_MB`, default 5120 MB).  
Partial S3 config is treated as **error** at startup — either set all vars or none.

**Path rules:** objects live at `{S3_PUBLIC_URL}/invitations/{file}` or `/music/{file}`.  
`S3_PUBLIC_URL` must be your CDN/custom domain — **not** the R2 API endpoint (`*.r2.cloudflarestorage.com`).  
Validation: `lib/s3.ts` + `pnpm check:env`.

### SMS wiring checklist (Mobizon / smsc.kz)

- [ ] Аккаунт провайдера создан, баланс пополнен
- [ ] `KZ_SMS_API_KEY` скопирован в root `.env`
- [ ] `KZ_SMS_SENDER=Invito` (или одобренное имя отправителя у провайдера)
- [ ] `SMS_PROVIDER=kz` (не `mock`) в production
- [ ] `KZ_SMS_API_URL` — только если не Mobizon default
- [ ] Тест: `POST /api/auth/request-otp` на +77… → SMS < 30 с
- [ ] `pnpm check:env` → `SMS_PROVIDER: ok`
- [ ] Логи app: нет `[KZ SMS] API error (401)`

### Scheduler (payments + cleanup)

Docker service `scheduler` runs:

- `reconcile-payments` every `RECONCILE_INTERVAL_SEC` (default 900 = 15 min)
- `cleanup` every `CLEANUP_INTERVAL_SEC` (default 86400 = 24 h)

```bash
docker compose ps scheduler
docker compose logs --tail=20 scheduler
```

### Captcha (before public launch)

- [ ] Read `apps/web/docs/CAPTCHA_SPEC.md`
- [ ] Default `CAPTCHA_PROVIDER=stub` — honeypot only; OK for staging
- [ ] Before launch: Turnstile keys + wire RSVP/wishes UI (Agent F / follow-up)


### Required for production startup

```env
NODE_ENV=production
APP_URL=https://yourdomain.kz
TRUST_PROXY=true
SESSION_SECRET=<32+ chars>
ADMIN_API_KEY=<32+ chars>
DATABASE_URL=postgresql://...   # auto in Docker; localhost:5432 for pnpm dev
WHATSAPP_NUMBER=7700XXXXXXX
NEXT_PUBLIC_WHATSAPP_NUMBER=7700XXXXXXX
```

`validateEnv()` in `instrumentation.ts` blocks app start if critical vars are missing or invalid.

---

## 2. VPS deploy checklist

- [ ] Root `.env` filled (see `.env.example`)
- [ ] `pnpm check:env` passes (errors = 0)
- [ ] `Caddyfile` — Option A (domain) or Option B (IP-only) from `Caddyfile.example`
- [ ] Ports 80/443 open in firewall
- [ ] `docker compose ps` — app, postgres, caddy, **scheduler** Up
- [ ] `./deploy.sh` — health `GET /api/health` returns `ok`
- [ ] `RUN_SEED=true` on first deploy only, then `RUN_SEED=false`
- [ ] Kaspi webhook URL registered and test payment completes
- [ ] OTP SMS arrives on real +77 number
- [ ] Photo upload returns URL on `S3_PUBLIC_URL` (or `/uploads/...` if no S3)

See root `README.md` § «Деплой на VPS» for step-by-step commands.

---

## 3. Pre-launch verification

- [ ] `pnpm test` green in CI
- [ ] `pnpm test:e2e` for critical flows
- [ ] `ALLOW_MOCK_PAYMENT=false` in production
- [ ] `APP_URL` matches SSL domain (OG/WhatsApp share links)
- [ ] Kaspi test payment 4 900 ₸ end-to-end (checkout → pay → publish)
- [ ] Scheduler logs show `[reconcile]` without fatal errors
- [ ] Webhook logs show `ok: true` (not `invalid_signature`)

---

## 4. Production readiness gaps (code cannot fix)

These require **your** credentials or assets — the app will run in degraded mode without them:

| Gap | Symptom | Fix |
|-----|---------|-----|
| No Kaspi keys | Paid templates cannot checkout | Kaspi Business onboarding |
| No webhook secret | Orders stuck `pending` after pay | Set secret + register URL in Kaspi |
| No KZ SMS | OTP login returns 503 | Mobizon/smsc.kz API key |
| No S3/R2 | Uploads on VPS disk only | Cloudflare R2 bucket + CDN domain |
| Wrong S3_PUBLIC_URL | Files 403 or wrong host | CDN domain, not API endpoint |
| No scheduler | Pending payments stuck if webhook fails | `scheduler` container in compose |
| Captcha stub in prod | Spam risk on RSVP/wishes | Turnstile per CAPTCHA_SPEC.md |
| No domain | HTTP only, no auto TLS | Buy domain, DNS A record, `APP_URL=https://...` |
| No WhatsApp number | Support CTA incomplete | Set `WHATSAPP_NUMBER` |

**Staging without keys:** free template `wedding-sage-minimal` (0 ₸) publishes without payment; mock SMS/pay only in dev with explicit flags.

---

## 5. Hero & brand assets (Agent 1)

| Item | Path |
|------|------|
| Hero photo | `public/assets/invitations/hero-invitation.jpg` — 2000×1400 minimum, 16:10 safe crop, ≤ 500 KB preferred |
| Favicon | `src/app/favicon.ico`, `apple-icon.png`, optional `src/app/icon.svg` scaffold |
| Brand textures | `public/assets/brand/marble-*.webp` |

See `ASSETS_REQUIRED.md` for template asset specs.

---

## 6. What we do **not** automate here

- Kaspi merchant onboarding (manual in business.kaspi.kz)
- SMS sender name approval (Mobizon/smsc.kz)
- Domain purchase & DNS
- Generating unique AI assets per template
