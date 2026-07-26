-- DropIndex
DROP INDEX "Guest_invitationId_phone_key";

-- DropIndex
DROP INDEX "Order_status_createdAt_idx";

-- CreateIndex
CREATE INDEX "Guest_invitationId_phone_idx" ON "Guest"("invitationId", "phone");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
