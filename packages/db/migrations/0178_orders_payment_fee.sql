-- 0178: Tallaby Pay fee paid by the customer (ROADMAP.md F-100j, owner 2026-11-22).
--
-- A store can choose who pays the Tallaby Pay fee (billing_settings.
-- tallaby_pay_fee_bps): the seller (default, the behaviour before F-100j: the
-- fee comes out of the paid amount) or the customer. The choice lives in the
-- store's `tallaby_pay` store_integrations row (config.feePayer; no column).
--
-- When the customer pays it and the shopper pays the whole order with Tallaby
-- Pay, checkout adds fee = round_half_up(base x bps / 10000) on top:
--   orders.total_amount       = base + fee (what the shopper paid; the
--                               EasyKash amount and the paid claim use it)
--   orders.payment_fee_amount = fee (Tallaby keeps exactly this)
-- and the settlement credits the seller total_amount - payment_fee_amount
-- (= base, 100%). The fee and rate are also snapshotted in
-- orders.metadata.tallabyPay (feePayer 'customer', customerFeePiastres).
-- Every other order (COD, deposits, seller gateways, seller-pays Tallaby Pay,
-- marketplace) keeps payment_fee_amount = 0.
--
-- Additive: one column with a constant default (no table rewrite on PG 11+)
-- and a guarded CHECK, NOT VALID then validated to keep the lock short. No row
-- changes. The order queries select every orders column, so apply it on
-- staging, then production, BEFORE deploying the code that ships with it.
-- Idempotent.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_fee_amount numeric(10,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_fee_amount_check') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_fee_amount_check CHECK (payment_fee_amount >= 0) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.orders VALIDATE CONSTRAINT orders_payment_fee_amount_check;

COMMENT ON COLUMN public.orders.payment_fee_amount IS
  'Tallaby Pay fee the customer paid on top (F-100j, 0178); included in total_amount. 0 unless the store''s customers pay the fee.';
