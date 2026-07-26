-- Add OrderType enum, SentVia enum, and missing indexes on Order model

-- Create OrderType as a PostgreSQL enum
CREATE TYPE "OrderType" AS ENUM ('self', 'managed');

-- Create SentVia as a PostgreSQL enum
CREATE TYPE "SentVia" AS ENUM ('whatsapp', 'sms', 'telegram', 'email');

-- Drop the text default before altering the column type
ALTER TABLE "Order" ALTER COLUMN "orderType" DROP DEFAULT;

-- Alter Order.orderType from String to OrderType enum
ALTER TABLE "Order" ALTER COLUMN "orderType" TYPE "OrderType"
  USING ("orderType"::text::"OrderType");

-- Re-add default after type change
ALTER TABLE "Order" ALTER COLUMN "orderType" SET DEFAULT 'self';

-- Alter Guest.sentVia from String to SentVia enum (no default to worry about)
ALTER TABLE "Guest" ALTER COLUMN "sentVia" TYPE "SentVia"
  USING ("sentVia"::text::"SentVia");

-- Add missing indexes on Order model
CREATE INDEX IF NOT EXISTS "Order_userId_status_idx" ON "Order" ("userId", "status");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_orderType_status_idx" ON "Order" ("orderType", "status");
