#!/usr/bin/env bash
# Daily Postgres backup for QazShaqyru Docker deployment.
# Usage: ./scripts/backup-db.sh [output_dir]

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "No .env file in repo root" >&2
  exit 1
fi

set -a
source .env
set +a

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$OUT_DIR/QazShaqyru_${STAMP}.sql.gz"

echo "Backing up database to $FILE ..."
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "${POSTGRES_DB:-invitation_db}" | gzip > "$FILE"
echo "Done. Size: $(du -h "$FILE" | cut -f1)"
