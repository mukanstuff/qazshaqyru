-- At most one pending self-service order per invitation (prevents checkout race duplicates).
CREATE UNIQUE INDEX IF NOT EXISTS "Order_pending_self_per_invitation_idx"
ON "Order" ("invitationId")
WHERE status = 'pending'
  AND "orderType" = 'self'
  AND "invitationId" IS NOT NULL;
