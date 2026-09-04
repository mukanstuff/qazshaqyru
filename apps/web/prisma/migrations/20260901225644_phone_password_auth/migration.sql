-- Phone + password auth (replaces the WhatsApp one-time-code login).
--
-- Every statement is guarded. This folder's history and the long-running
-- database had drifted apart in BOTH directions (someone had used
-- `prisma db push`): the live DB carried `User_email_idx` / `User_phone_idx`
-- that no migration creates, while the history already creates
-- `User_phone_key`, which the live DB had lost. An unguarded version of this
-- file aborts on one side or the other, which is why `prisma migrate deploy`
-- into a fresh database used to fail outright.
DROP INDEX IF EXISTS "User_email_idx";
DROP INDEX IF EXISTS "User_phone_idx";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

DROP TABLE IF EXISTS "OTPToken";

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
