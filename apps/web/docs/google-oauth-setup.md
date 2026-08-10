# Google OAuth setup

Primary login method. Replaces SMS one-time codes. Cost: $0 (free forever).

## Why

SMS was burning the launch budget. Google OAuth is free, removes the SMS-provider
dependency, and gives us verified emails (no fake phone numbers) so we can later
use email-based notifications (recover account, send invitation receipts, etc.).

## Step 1 — Google Cloud project

1. Open https://console.cloud.google.com/ and create a project (or pick an existing one).
2. APIs & Services → Library → enable **Google Identity Services** (for ID-token flows)
   and **People API** (so we can later fetch profiles if needed; not strictly required
   for OAuth login).
3. APIs & Services → **OAuth consent screen**:
   - User type: **External**
   - App name: `QazShaqyru`
   - User support email: your address
   - Developer contact: same
   - Scopes: `openid`, `email`, `profile`
   - Test users (while in testing mode): add the emails you'll log in with
4. APIs & Services → **Credentials** → Create credentials → **OAuth client ID**:
   - Application type: **Web application**
   - Name: `QazShaqyru Web`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://qazshaqyru.kz` (your production domain)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://qazshaqyru.kz/api/auth/google/callback`
5. Copy the **Client ID** and **Client secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-..."
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="...same as GOOGLE_CLIENT_ID..."
   ```

## Step 2 — Database migration

```bash
cd apps/web
pnpm db:push          # dev (Postgres accepts schema changes without migration files)
# or
pnpm db:migrate dev --name google_oauth
```

The schema changes:
- `User.phone` becomes optional, `@unique` removed.
- `User.email String? @unique` and `User.avatarUrl String?` added.
- New table `Identity` (`provider`, `providerId`, `providerEmail`, `userId`).

## Step 3 — Code review

| File | Purpose |
|---|---|
| `src/lib/auth/google.ts` | Verifies Google ID token (RS256 + JWKS via WebCrypto, no deps) |
| `src/lib/auth/google-env.ts` | Reads config; returns null when not configured (so dev doesn't crash) |
| `src/lib/auth/oauth-state.ts` | Signed CSRF state + returnTo cookie for the redirect flow |
| `src/lib/auth/identity-merge.ts` | Find-or-create `User` + `Identity`, issue a session row |
| `src/app/api/auth/google/start/route.ts` | GET — redirect to Google with CSRF state |
| `src/app/api/auth/google/callback/route.ts` | GET — exchange `code`, verify id_token, set cookie, redirect |
| `src/app/api/auth/google/exchange/route.ts` | POST — accepts raw idToken from client (reserved for future popup flow) |
| `src/components/auth/GoogleLoginButton.tsx` | UI button — anchors to `/api/auth/google/start` |

## Step 4 — Test

1. Start dev server: `pnpm dev`.
2. Visit `http://localhost:3000/login` — you should see a single "Войти через Google" button.
3. Click it. You'll bounce to Google, consent, bounce back to `/dashboard`.
4. Inspect the `session_token` cookie (httpOnly, lax).
5. Reload `/dashboard` — the session persists.

## Production rollout

1. Add the production redirect URI in Google Cloud (Step 1.4 above).
2. Set `GOOGLE_REDIRECT_URI=https://qazshaqyru.kz/api/auth/google/callback` in prod env.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in prod env (Vercel/Docker secrets).
4. Submit the OAuth consent screen for verification (External, sensitive scopes
   may take a few days; `openid/email/profile` is usually auto-approved).

## Removing the SMS flow (Phase 3)

After OAuth is stable in prod (≥1 week, low error rate):

1. Delete `src/app/api/auth/request-otp/`, `verify-otp/`, `src/lib/shared/sms.ts`.
2. Remove `SMS_PROVIDER`, `KZ_SMS_*`, `TWILIO_*` from `.env.example`.
3. Remove the unused phone-imports from `login-form.tsx`, `LoginModal.tsx`,
   `login/page.tsx`, and the `formatPhone` helper.
4. Drop the `kz` locale validation in `validatePhone()` (we no longer need it
   on the auth side; only WhatsApp will need it).

## WhatsApp OTP (Phase 2 — preparation)

The `Identity` model and the WhatsApp env-vars are already in place. To enable:

1. Register a Meta Business account and verify the phone number.
2. Create an `AUTH_CODE` template in Meta Business Manager.
3. Fill in `AUTH_WHATSAPP_ENABLED=true`, `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`,
   `WHATSAPP_AUTH_TEMPLATE_NAME` (must match the template registered).
4. The existing `/api/auth/request-otp` route will switch to WhatsApp when
   the env flag is true. No code changes needed.

## Cost

- Google OAuth: $0 forever.
- WhatsApp OTP: ~$0.0001 per code (Meta). First 1000 service messages / month
  per phone number are free. A 10K-login month = ~$1.
- No additional server cost: same Next.js routes, same Postgres table layout.