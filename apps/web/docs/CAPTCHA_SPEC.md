# Captcha layer — design spec (Turnstile / hCaptcha)

> **Status:** server wired (`lib/captcha.ts` + RSVP/open-RSVP/wishes routes). Client widget pending.

## Goals

- Block automated spam on **public** endpoints without hurting mobile UX.
- Provider-agnostic server API; swap env vars to enable.
- Fail closed in production once `CAPTCHA_PROVIDER` is set (missing token = reject).

## Scope (phase 1)

| Endpoint | Today | After captcha |
|----------|-------|---------------|
| `POST /api/rsvp` | honeypot | honeypot + captcha token |
| `POST /api/rsvp/open` | honeypot | honeypot + captcha token |
| `POST /api/wishes` | honeypot | honeypot + captcha token |
| `POST /api/auth/request-otp` | rate limit | optional captcha (phase 2) |

## Providers

### Cloudflare Turnstile (recommended)

- Free tier, low friction, good mobile UX.
- Env: `CAPTCHA_PROVIDER=turnstile`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- Client: `@marsidev/react-turnstile` or script tag on RSVP/wish forms only.
- Verify: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`

### hCaptcha (alternative)

- Env: `CAPTCHA_PROVIDER=hcaptcha`, `HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET_KEY`
- Verify: `POST https://api.hcaptcha.com/siteverify`

## Server module

`src/lib/captcha.ts`:

```ts
verifyCaptchaToken({ token, remoteIp }) → { ok, error?, provider }
getCaptchaProvider() → 'stub' | 'turnstile' | 'hcaptcha'
```

- `stub` (default): always passes; logs warning in production.
- `turnstile` / `hcaptcha`: require secret + non-empty token; HTTP verify with 10s timeout.

## Rollout checklist

1. [ ] Create Turnstile site in Cloudflare dashboard (domain = `APP_URL` host).
2. [ ] Set env vars in root `.env` and redeploy app container.
3. [ ] Add widget to RSVP + wishes client forms; pass `captchaToken` in JSON body.
4. [x] API routes: call `verifyCaptchaToken` before business logic; return `400 captcha_failed`.
5. [ ] Set `CAPTCHA_PROVIDER=turnstile` in production; confirm `check:env` warns if secret missing.
6. [ ] E2E: stub in CI (`CAPTCHA_PROVIDER=stub`), manual smoke on staging with real widget.

## Env example

```env
# stub | turnstile | hcaptcha
CAPTCHA_PROVIDER=stub
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=
```

## Non-goals (this phase)

- Captcha on editor/auth flows (rate limit + OTP sufficient for launch).
- Invisible v3 reCAPTCHA (deprecated pattern; prefer Turnstile).
