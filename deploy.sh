#!/usr/bin/env bash
# Invito production deploy
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
  err "No .env file found. Copy .env.example to .env and fill in required values."
  exit 1
fi

set -a
source .env
set +a

for var in SESSION_SECRET DATABASE_URL APP_URL POSTGRES_USER POSTGRES_PASSWORD; do
  if [[ -z "${!var:-}" ]] || [[ "${!var}" == CHANGE_ME* ]]; then
    err "Variable $var is not set or has a placeholder value."
    exit 1
  fi
done

if [[ "${#SESSION_SECRET}" -lt 32 ]]; then
  err "SESSION_SECRET must be at least 32 characters."
  exit 1
fi

if [[ "${APP_URL}" != https://* ]]; then
  warn "APP_URL is not https — Caddy will not obtain a TLS certificate."
fi

log "Building images..."
docker compose build --no-cache

log "Starting services..."
docker compose up -d

log "Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
  sleep 2
done

log "Running migrations..."
docker compose exec -T app npx prisma migrate deploy

log "Seeding templates..."
docker compose exec -T app npx tsx scripts/seed.ts || warn "Seed step failed (continuing)"

log "Health check..."
APP_PORT=3000
for i in {1..20}; do
  if curl -sf "http://localhost:${APP_PORT}/api/auth/session" >/dev/null 2>&1; then
    log "App is healthy!"
    log "Public URL: ${APP_URL}"
    exit 0
  fi
  sleep 2
done

err "App did not become healthy in time. Inspect: docker compose logs app"
exit 1
