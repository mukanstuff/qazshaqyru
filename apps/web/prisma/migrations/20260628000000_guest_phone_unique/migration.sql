-- Restore unique phone per invitation (allows multiple guests without phone — NULL is distinct in PG)
CREATE UNIQUE INDEX IF NOT EXISTS "Guest_invitationId_phone_key" ON "Guest"("invitationId", "phone");
