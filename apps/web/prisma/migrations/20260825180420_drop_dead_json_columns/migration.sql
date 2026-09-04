-- Drop confirmed-dead columns:
--   Template.config, Template.editableConfig — zero references anywhere in
--     application code (grep-confirmed before this migration was written).
--   Invitation.mobileCanvas, Template.mobileCanvas — written by several
--     endpoints but never read by any renderer or client; there is no
--     viewport-conditional canvas selection anywhere in the app.
-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "mobileCanvas";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "config",
DROP COLUMN "editableConfig",
DROP COLUMN "mobileCanvas";
