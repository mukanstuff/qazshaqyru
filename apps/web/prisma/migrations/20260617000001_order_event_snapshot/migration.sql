-- Add eventDate and eventType snapshot to Order.
-- These let the success page materialise the draft Invitation without
-- having to ask the customer again for the date.

ALTER TABLE "Order" ADD COLUMN "eventDate" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "eventType" "EventType";
