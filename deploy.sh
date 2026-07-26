#!/usr/bin/env bash
# QazShaqyru production deploy
# Requirements: docker, docker compose v2, openssl, curl

set -euo pipefail

cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log() { printf "${GREEN}[deploy]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[deploy]${NC} %s\n" "$*"; }
err() { printf "${RED}[deploy]${NC} %s\n" "$*" >&2; }

require() {
  command -v "$1" >/dev/null 2>&1 || { err "Required: $1"; exit 1; }
}

require docker
require openssl
require curl
docker compose version >/dev/null 2>&1 || { err "docker compose v2 not found"; exit 1; }

if [[ ! -f .env ]]; then
  err "No .env file found. Copy .env.example to .env in repo root and fill in required values."
  exit 1
fi

set -a
source .env
set +a

for var in SESSION_SECRET APP_URL POSTGRES_USER POSTGRES_PASSWORD; do
  if [[ -z "${!var:-}" ]] || [[ "${!var}" == CHANGE_ME* ]]; then
    err "Variable $var is not set or has a placeholder value."
    exit 1
  fi
done

if [[ "${#SESSION_SECRET}" -lt 32 ]]; then
  err "SESSION_SECRET must be at least 32 characters."
  exit 1
fi

if command -v pnpm >/dev/null 2>&1 && [[ -f apps/web/package.json ]]; then
  log "Running production env checklist..."
  if ! (cd apps/web && NODE_ENV=production pnpm exec tsx scripts/check-production-env.ts --env-file ../../.env); then
    err "Production env check failed. Fix .env before deploy."
    exit 1
  fi
else
  warn "pnpm not found — run manually after install: cd apps/web && pnpm check:env"
fi

if [[ "${APP_URL}" != https://* ]]; then
  warn "APP_URL is not https — Caddy will not obtain a TLS certificate (OK for IP-only testing)."
fi

if [[ "${SMS_PROVIDER:-mock}" == "mock" ]]; then
  warn "SMS_PROVIDER=mock — OTP codes will NOT be delivered to real phones."
fi

if [[ -z "${PAYMENT_PROVIDER:-}" ]] && [[ "${ALLOW_MOCK_PAYMENT:-false}" != "true" ]]; then
  warn "PAYMENT_PROVIDER is not set — only free templates can be published until Kaspi/Freedom is configured."
fi

if [[ "${PAYMENT_PROVIDER:-}" == "kaspi" ]] && [[ -z "${KASPI_WEBHOOK_SECRET:-}" ]]; then
  warn "KASPI_WEBHOOK_SECRET is empty — payment webhooks will not verify until this is set."
fi

log "Building images..."
docker compose build

log "Starting services (migrations run via container entrypoint)..."
docker compose up -d

log "Waiting for app health..."
for i in {1..30}; do
  if docker compose exec -T app wget -q -O- http://localhost:3000/api/health 2>/dev/null | grep -q '"status":"ok"'; then
    log "App is healthy!"
    log "Public URL: ${APP_URL}"
    log "Tip: set RUN_SEED=true in .env for first deploy only, then set RUN_SEED=false."
    log "Tip: schedule daily cleanup: docker compose exec app pnpm cleanup"
    log "Tip: schedule DB backups: ./scripts/backup-db.sh"
    exit 0
  fi
  sleep 3
done

err "App did not become healthy in time. Inspect: docker compose logs app"
exit 1
