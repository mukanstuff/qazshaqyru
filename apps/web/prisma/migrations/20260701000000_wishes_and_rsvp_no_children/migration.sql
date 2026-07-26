-- AlterEnum
ALTER TYPE "GuestResponseStatus" ADD VALUE 'attending_no_children';

-- CreateTable
CREATE TABLE "Wish" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishLike" (
    "id" TEXT NOT NULL,
    "wishId" TEXT NOT NULL,
    "likerHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wish_invitationId_idx" ON "Wish"("invitationId");

-- CreateIndex
CREATE INDEX "Wish_invitationId_createdAt_idx" ON "Wish"("invitationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WishLike_wishId_idx" ON "WishLike"("wishId");

-- CreateIndex
CREATE UNIQUE INDEX "WishLike_wishId_likerHash_key" ON "WishLike"("wishId", "likerHash");

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishLike" ADD CONSTRAINT "WishLike_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "Wish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
