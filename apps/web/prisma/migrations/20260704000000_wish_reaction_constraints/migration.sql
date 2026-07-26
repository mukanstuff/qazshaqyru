-- Guest index cleanup + WishReaction constraint renames (idempotent).
-- Safe when WishLike → WishReaction already renamed constraints/indexes.

DROP INDEX IF EXISTS "Guest_invitationId_phone_idx";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WishLike_pkey' AND conrelid = '"WishReaction"'::regclass
  ) THEN
    ALTER TABLE "WishReaction" RENAME CONSTRAINT "WishLike_pkey" TO "WishReaction_pkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WishLike_wishId_fkey' AND conrelid = '"WishReaction"'::regclass
  ) THEN
    ALTER TABLE "WishReaction" RENAME CONSTRAINT "WishLike_wishId_fkey" TO "WishReaction_wishId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'WishLike_wishId_idx') THEN
    ALTER INDEX "WishLike_wishId_idx" RENAME TO "WishReaction_wishId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'WishLike_wishId_likerHash_key') THEN
    ALTER INDEX "WishLike_wishId_likerHash_key" RENAME TO "WishReaction_wishId_likerHash_key";
  END IF;
END $$;
