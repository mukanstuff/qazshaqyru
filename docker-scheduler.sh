#!/bin/sh
# Background scheduler: payment reconcile + periodic DB/upload cleanup.
set -eu

RECONCILE_INTERVAL_SEC="${RECONCILE_INTERVAL_SEC:-900}"
CLEANUP_INTERVAL_SEC="${CLEANUP_INTERVAL_SEC:-86400}"

last_cleanup=0

echo "[scheduler] reconcile every ${RECONCILE_INTERVAL_SEC}s, cleanup every ${CLEANUP_INTERVAL_SEC}s"

while true; do
  cd /app/apps/web

  tsx scripts/reconcile-payments.ts || echo "[scheduler] reconcile failed (non-fatal)"

  now=$(date +%s)
  if [ "$((now - last_cleanup))" -ge "$CLEANUP_INTERVAL_SEC" ]; then
    tsx scripts/cleanup.ts || echo "[scheduler] cleanup failed (non-fatal)"
    last_cleanup=$now
  fi

  sleep "$RECONCILE_INTERVAL_SEC"
done
