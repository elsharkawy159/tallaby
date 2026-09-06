-- Hold affiliate wallet credit until RETURN_WINDOW_DAYS after delivery.
-- eligible_at is null until the order is delivered; then set to delivered_at + window.
ALTER TABLE "affiliate_commissions"
  ADD COLUMN IF NOT EXISTS "eligible_at" timestamp with time zone;

-- Cron release query: pending commissions whose hold has elapsed.
CREATE INDEX IF NOT EXISTS "affiliate_commissions_pending_eligible_at_idx"
  ON "affiliate_commissions" USING btree ("status", "eligible_at")
  WHERE type = 'commission' AND status = 'pending';
