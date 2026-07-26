#!/bin/sh
set -e

cd /app/apps/web

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
  echo "[entrypoint] Running database migrations..."
  prisma migrate deploy --schema=./prisma/schema.prisma
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  tsx scripts/seed.ts
fi

exec "$@"
