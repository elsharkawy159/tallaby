-- 24-hour top-up reminder (owner, 2026-11-15).
--
-- 24 hours after a seller's first store was created, a seller who isn't
-- activated (no top-up, no store wallet balance ever above zero, no active Pro;
-- packages/lib/src/billing/order-lock.lib.ts) gets one bell row asking them to
-- top up: seller notification type `top_up_reminder` (data = {}), dedupe_key
-- `top_up_reminder_24h:<sellerId>`, so once per seller. The dashboard cron
-- /api/cron/top-up-reminders (hourly) inserts the rows with ON CONFLICT DO
-- NOTHING; the seller push dispatcher pushes them like the other account types
-- (0124/0131 webhook on INSERT).
--
-- This migration only widens the type check. Additive and idempotent: safe to
-- re-run. Until it is applied the cron inserts nothing and returns
-- `migration_missing` (the check rejects the type), so deploying the code
-- first is harmless.

-- Seller bell type, widened from the live definition (a superset of it).
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'seller_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%top_up_reminder%' THEN
    EXECUTE 'ALTER TABLE public.seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''top_up_reminder''::text]');
  END IF;
END $$;
