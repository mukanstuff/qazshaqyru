-- Family preview link for unpublished invitations (share with relatives before payment).
ALTER TABLE "Invitation" ADD COLUMN "previewTokenHash" TEXT;

CREATE UNIQUE INDEX "Invitation_previewTokenHash_key" ON "Invitation"("previewTokenHash");
