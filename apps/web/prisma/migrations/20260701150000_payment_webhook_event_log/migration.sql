-- Webhook event log for idempotency + audit trail.
CREATE TABLE "PaymentWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "orderId" TEXT,
  "paymentId" TEXT,
  "action" TEXT NOT NULL,
  "signatureValid" BOOLEAN NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "payloadHash" TEXT NOT NULL,

  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentWebhookEvent_dedupeKey_key" ON "PaymentWebhookEvent"("dedupeKey");
CREATE INDEX "PaymentWebhookEvent_provider_receivedAt_idx" ON "PaymentWebhookEvent"("provider", "receivedAt");
CREATE INDEX "PaymentWebhookEvent_orderId_receivedAt_idx" ON "PaymentWebhookEvent"("orderId", "receivedAt");
