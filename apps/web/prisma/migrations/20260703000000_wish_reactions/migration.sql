-- Rename WishLike → WishReaction and add emoji column for multi-emoji parity.
ALTER TABLE "WishLike" RENAME TO "WishReaction";

ALTER TABLE "WishReaction" ADD COLUMN "emoji" TEXT NOT NULL DEFAULT 'heart';

CREATE INDEX "WishReaction_wishId_emoji_idx" ON "WishReaction"("wishId", "emoji");
