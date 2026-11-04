-- 0149: free gifts in the cart and coupons shown in the cart (ROADMAP.md F-13c,
-- docs/superpowers/specs/2026-11-04-quantity-offers-design.md §9).
--
-- cart_items.gift_rule_id marks a free gift the customer picked. Its price is 0,
-- it takes stock, and checkout checks the rule again. CASCADE, not SET NULL: a line
-- that lost its rule must never stay in a cart at price 0 as a normal item.
--
-- coupons.show_in_cart is off by default, so nothing a seller shared privately
-- (an affiliate's code, a code for one customer) starts showing to everyone.
--
-- Additive and idempotent. Apply BEFORE deploying: the Drizzle queries on cart_items
-- and coupons select every column.

ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS gift_rule_id uuid
  REFERENCES public.store_discount_rules(id) ON DELETE CASCADE;

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS show_in_cart boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS coupons_seller_show_in_cart_idx
  ON public.coupons (seller_id) WHERE show_in_cart;

-- Rollback: DROP INDEX coupons_seller_show_in_cart_idx; ALTER TABLE coupons DROP COLUMN show_in_cart;
-- ALTER TABLE cart_items DROP COLUMN gift_rule_id;
