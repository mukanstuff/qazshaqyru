-- Add sundet_toy event/category and invitation view counter
ALTER TYPE "EventType" ADD VALUE 'sundet_toy';
ALTER TYPE "TemplateCategory" ADD VALUE 'sundet_toy';

ALTER TABLE "Invitation" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
