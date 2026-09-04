-- Family-preview tokens are gone.
--
-- Nothing ever minted one: the POST that issued the token and the GET that
-- consumed it were both 410 stubs, and no row in this table has ever carried a
-- non-null hash. The column, its unique index and the reader branches that
-- checked it were scaffolding for a feature the product rule forbids (a draft
-- may not be shared before payment).
DROP INDEX IF EXISTS "Invitation_previewTokenHash_key";
ALTER TABLE "Invitation" DROP COLUMN IF EXISTS "previewTokenHash";
