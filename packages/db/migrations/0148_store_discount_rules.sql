-- 0148: automatic discount rules of a store (ROADMAP.md F-13a,
-- docs/superpowers/specs/2026-11-04-quantity-offers-design.md §8).
--
-- Store-wide, no code: a percent off everything or some categories (a sale when it
-- has an end date), buy X get Y, and a free gift over an amount (F-13c). The
-- discount is computed in place-order from these rows and comes out of the seller's
-- own lines.
--
-- Additive and idempotent. Nothing selects it until the code that reads it is
-- deployed, so apply on staging, then production, before deploying.

CREATE TABLE IF NOT EXISTS public.store_discount_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id         uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name             text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  rule_type        text NOT NULL CHECK (rule_type IN ('percent_off', 'buy_x_get_y', 'free_gift')),
  scope            text NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'categories')),
  -- seller_product_categories ids; the rule is skipped for a category that is gone.
  category_ids     uuid[] NOT NULL DEFAULT '{}',
  discount_percent numeric(5,2),
  buy_quantity     integer,
  get_quantity     integer,
  min_subtotal     numeric(10,2),
  gift_product_ids uuid[] NOT NULL DEFAULT '{}',
  starts_at        timestamptz NOT NULL DEFAULT now(),
  ends_at          timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_discount_rules_window CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT store_discount_rules_shape CHECK (
    (rule_type = 'percent_off' AND discount_percent BETWEEN 1 AND 90)
    OR (rule_type = 'buy_x_get_y' AND discount_percent BETWEEN 1 AND 100 AND buy_quantity BETWEEN 1 AND 100 AND get_quantity BETWEEN 1 AND 100)
    OR (rule_type = 'free_gift' AND min_subtotal >= 0 AND cardinality(gift_product_ids) BETWEEN 1 AND 10)
  )
);

CREATE INDEX IF NOT EXISTS store_discount_rules_store_idx
  ON public.store_discount_rules (store_id) WHERE is_active;

-- Server-only.
ALTER TABLE public.store_discount_rules ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.store_discount_rules;
