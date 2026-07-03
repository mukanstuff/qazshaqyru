ALTER TABLE "PaymentWebhookEvent"
ADD COLUMN "processingState" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastError" TEXT;
