-- 0166: Cash-on-delivery deposit (عربون), ROADMAP.md F-21 (owner approval 2026-11-12).
--
-- A store can ask every COD order for a deposit of 10, 20, 30 or 50 % of the
-- total, rounded up to the nearest 5 currency units and never above the total
-- (packages/lib/src/orders/cod-deposit.lib.ts). The setting lives in
-- stores.settings.codDeposit (JSON, no column). The customer pays the deposit
-- to the SELLER: their own card gateway (F-39) or their own wallet / InstaPay
-- with a screenshot (F-21p). Tallaby never holds it and no ledger row is
-- written; the platform fee is unchanged. The rest is cash on delivery, so the
-- carrier COD amount is total - deposit once the deposit is paid.
--
-- Columns on orders (all NULL on every existing order and on orders without a
-- deposit):
--   deposit_amount   numeric(10,2)  the deposit due, in the order's currency
--   deposit_percent  smallint       10 | 20 | 30 | 50
--   deposit_status   text           awaiting | reported (customer says sent) | paid
--   deposit_paid_at  timestamptz    when the seller confirmed it or the gateway paid it
-- The order waits while the deposit is awaiting or reported; an order still
-- `awaiting` 48 h after it was created is cancelled by the ecommerce cron
-- /api/cron/cod-deposits (stock goes back with reason `cancel`).
--
-- Seller bell types `deposit_reported` (the customer sent a transfer
-- screenshot / said they paid) and `deposit_paid` (the seller's gateway paid
-- it), widened from the live definition, guarded.
--
-- Additive, but the order queries select every column, so apply it on staging,
-- then production, BEFORE deploying the code that ships with it. Idempotent.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deposit_percent smallint;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deposit_status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_deposit_check') THEN
    -- Every existing row has all four NULL, so NOT VALID + VALIDATE is quick and keeps the lock short.
    ALTER TABLE public.orders ADD CONSTRAINT orders_deposit_check CHECK (
      (deposit_status IS NULL OR deposit_status IN ('awaiting', 'reported', 'paid'))
      AND (deposit_percent IS NULL OR deposit_percent IN (10, 20, 30, 50))
      AND (deposit_amount IS NULL OR deposit_amount >= 0)
      AND ((deposit_status IS NULL) = (deposit_amount IS NULL))
    ) NOT VALID;
    ALTER TABLE public.orders VALIDATE CONSTRAINT orders_deposit_check;
  END IF;
END $$;

-- The 48 h cron and the dashboard "awaiting deposit" stage read only the few unpaid ones.
CREATE INDEX IF NOT EXISTS orders_deposit_pending_idx
  ON public.orders (created_at)
  WHERE deposit_status IN ('awaiting', 'reported');

COMMENT ON COLUMN public.orders.deposit_amount IS
  'COD deposit due (F-21), paid to the seller, never to Tallaby; NULL = no deposit.';
COMMENT ON COLUMN public.orders.deposit_status IS
  'COD deposit (F-21): awaiting | reported | paid; NULL = no deposit.';

-- Seller bell types, widened from the live definition (a superset of it).
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'seller_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%deposit_reported%' THEN
    EXECUTE 'ALTER TABLE public.seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''deposit_reported''::text, ''deposit_paid''::text]');
  END IF;
END $$;
