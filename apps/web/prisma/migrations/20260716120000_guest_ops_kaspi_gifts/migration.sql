-- Guest ops: household, openedAt, seating, Kaspi gift transfers

ALTER TABLE "Guest" ADD COLUMN IF NOT EXISTS "householdLabel" TEXT;
ALTER TABLE "Guest" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Guest_invitationId_householdLabel_idx" ON "Guest"("invitationId", "householdLabel");

CREATE TABLE IF NOT EXISTS "GiftTransfer" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "guestId" TEXT,
    "authorName" TEXT NOT NULL,
    "note" TEXT,
    "fingerprintHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GiftTransfer_invitationId_fingerprintHash_key" ON "GiftTransfer"("invitationId", "fingerprintHash");
CREATE INDEX IF NOT EXISTS "GiftTransfer_invitationId_createdAt_idx" ON "GiftTransfer"("invitationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "GiftTransfer_guestId_idx" ON "GiftTransfer"("guestId");

CREATE TABLE IF NOT EXISTS "SeatingTable" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingTable_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeatingTable_invitationId_name_key" ON "SeatingTable"("invitationId", "name");
CREATE INDEX IF NOT EXISTS "SeatingTable_invitationId_sortOrder_idx" ON "SeatingTable"("invitationId", "sortOrder");

CREATE TABLE IF NOT EXISTS "SeatingAssignment" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatingAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeatingAssignment_guestId_key" ON "SeatingAssignment"("guestId");
CREATE INDEX IF NOT EXISTS "SeatingAssignment_tableId_idx" ON "SeatingAssignment"("tableId");

DO $$ BEGIN
  ALTER TABLE "GiftTransfer" ADD CONSTRAINT "GiftTransfer_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GiftTransfer" ADD CONSTRAINT "GiftTransfer_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SeatingTable" ADD CONSTRAINT "SeatingTable_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "SeatingTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
