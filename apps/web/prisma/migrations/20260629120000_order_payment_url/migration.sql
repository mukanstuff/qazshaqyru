-- Store provider checkout URL so users can resume payment without a new session.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentUrl" TEXT;
