-- DropIndex
DROP INDEX "payments_orderId_key";

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");
