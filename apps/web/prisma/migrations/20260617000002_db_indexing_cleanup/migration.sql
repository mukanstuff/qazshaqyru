-- Supporting indexes for common query paths.
--
-- Invitation.userId+status+createdAt desc is hit by the dashboard query
-- "list my non-archived invitations in newest-first order". Without the
-- compound index Postgres falls back to a sort, which becomes painful
-- once a user has hundreds of events.
--
-- Order.userId+status is hit by the admin "pending orders" view.
-- Order.createdAt desc is hit by admin "all orders" listing.
-- Session.userId+expiresAt is hit by "revoke old sessions for a user".
-- OTPToken.phone+usedAt is hit by "is there an unused OTP for this phone".

CREATE INDEX IF NOT EXISTS "Invitation_userId_status_createdAt_idx"
  ON "Invitation"("userId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Order_userId_status_idx"
  ON "Order"("userId", "status");

CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx"
  ON "Order"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "RateLimitEntry_resetAt_idx"
  ON "RateLimitEntry"("resetAt");
