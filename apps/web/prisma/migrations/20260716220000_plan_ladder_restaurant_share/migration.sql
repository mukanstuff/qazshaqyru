-- Plan ladder + restaurant share links

DO $$ BEGIN
  CREATE TYPE "PlanSku" AS ENUM ('standard', 'premium', 'agency');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanScope" AS ENUM ('invitation', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planSku" "PlanSku";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planActivatedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_planSku_planExpiresAt_idx" ON "User"("planSku", "planExpiresAt");

ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "unlockedPlanSku" "PlanSku";
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "unlockedAt" TIMESTAMP(3);
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "unlockOrderId" TEXT;

CREATE INDEX IF NOT EXISTS "Invitation_unlockedPlanSku_idx" ON "Invitation"("unlockedPlanSku");

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "planSku" "PlanSku";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "planScope" "PlanScope";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "planDurationDays" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Order_planSku_idx" ON "Order"("planSku");

-- Backfill: paid self-orders on invitations → standard unlock
UPDATE "Invitation" AS i
SET
  "unlockedPlanSku" = 'standard',
  "unlockedAt" = o."paidAt",
  "unlockOrderId" = o."id"
FROM (
  SELECT DISTINCT ON ("invitationId")
    "id",
    "invitationId",
    "paidAt"
  FROM "Order"
  WHERE "status" = 'paid'
    AND "orderType" = 'self'
    AND "invitationId" IS NOT NULL
  ORDER BY "invitationId", "paidAt" DESC NULLS LAST, "createdAt" DESC
) AS o
WHERE i."id" = o."invitationId"
  AND i."unlockedPlanSku" IS NULL;

UPDATE "Order"
SET
  "planSku" = 'standard',
  "planScope" = 'invitation'
WHERE "status" = 'paid'
  AND "orderType" = 'self'
  AND "invitationId" IS NOT NULL
  AND "planSku" IS NULL;

CREATE TABLE IF NOT EXISTS "RestaurantShareLink" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantShareLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RestaurantShareLink_tokenHash_key" ON "RestaurantShareLink"("tokenHash");
CREATE INDEX IF NOT EXISTS "RestaurantShareLink_invitationId_idx" ON "RestaurantShareLink"("invitationId");
CREATE INDEX IF NOT EXISTS "RestaurantShareLink_invitationId_revokedAt_idx" ON "RestaurantShareLink"("invitationId", "revokedAt");

DO $$ BEGIN
  ALTER TABLE "RestaurantShareLink"
    ADD CONSTRAINT "RestaurantShareLink_invitationId_fkey"
    FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
