-- Google sign-in schema, recovered from a `prisma db push`.
--
-- The Identity table, User.email, User.avatarUrl and the nullable User.phone
-- have existed in the development/production database for a long time, but no
-- migration in this folder ever created them: they were applied with
-- `prisma db push`, which changes the database without recording anything.
--
-- The consequence was invisible until you tried to build a NEW environment.
-- `prisma migrate status` reported "Database schema is up to date!" — it only
-- compares the list of applied migration names — while replaying the history
-- into an empty database produced a schema with no Identity table at all, so a
-- fresh deploy would have come up with Google sign-in silently broken.
--
-- Every statement is guarded so this is safe to run against a database that
-- already has some or all of it.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "Identity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Identity_userId_idx" ON "Identity"("userId");
CREATE INDEX IF NOT EXISTS "Identity_providerEmail_idx" ON "Identity"("providerEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "Identity_provider_providerId_key" ON "Identity"("provider", "providerId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

DO $$
BEGIN
  ALTER TABLE "Identity" ADD CONSTRAINT "Identity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
