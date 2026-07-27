-- Canvas document for the new WYSIWYG invitation editor.
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "canvas" JSONB;
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "mobileCanvas" JSONB;

-- Visual seating editor: absolute positioning for SeatingTable on hall canvas.
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "x" DOUBLE PRECISION;
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "y" DOUBLE PRECISION;
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "w" DOUBLE PRECISION;
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "h" DOUBLE PRECISION;
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "rotation" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "shape" TEXT;
ALTER TABLE "SeatingTable" ADD COLUMN IF NOT EXISTS "tableColor" TEXT;

-- Admin-created canvas-backed templates.
ALTER TABLE "Template"  ADD COLUMN IF NOT EXISTS "canvas" JSONB;
ALTER TABLE "Template"  ADD COLUMN IF NOT EXISTS "mobileCanvas" JSONB;
ALTER TABLE "Template"  ADD COLUMN IF NOT EXISTS "isCanvasTemplate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Template"  ADD COLUMN IF NOT EXISTS "editableConfig" JSONB;
