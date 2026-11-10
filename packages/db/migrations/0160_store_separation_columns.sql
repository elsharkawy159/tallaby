-- Fully separate stores, step 1: additive columns and tables (ROADMAP.md F-87b,
-- docs/plans/stores-separation.md §2 and §3.1 row 1; owner 2026-11-10).
--
-- Nothing reads or writes these yet. The data moves come later, each ending
-- with its own one-way switch: 0163 (catalog split, `stores_catalog_split`)
-- and 0164 (wallet split, `stores_wallet_split`). Until then every new column
-- is NULL and both switches are off, so today's behaviour is unchanged.
--
-- 1. `platform_switches`: one-way switches the code reads fresh per request
--    (packages/lib/src/stores/platform-switches.server.ts). Server-only: RLS
--    on, no policies. Seeded with the two F-87 switches, both off.
-- 2. `products.store_id`: the store that will own the product after 0163.
--    Nullable now (NOT NULL in 0165). ON DELETE CASCADE: an owned row, like
--    the other store children (0134). Three indexes for the per-store lists.
-- 3. `product_store_split`: the old → new id map 0163 writes and "Copy to
--    store" (F-87j) reuses (§2.1.2). Server-only: RLS on, no policies.
-- 4. Nullable `store_id` on the seller taxonomy (`seller_product_categories`,
--    `seller_product_brands`, `seller_categories`) and on `coupons`
--    (CASCADE: owned by the store; a NULL coupon keeps meaning "every store"),
--    and on `seller_wallet_top_ups` (NO ACTION: a store with top-up history is
--    never hard-deleted on its own; a user delete still cascades through
--    sellers, since the top-up row goes in the same statement).
-- 5. `stores.activated_at`: set once when a store is activated (§2.2, §2.3).
--    No backfill here (that is 0164, owner Q1).
-- 6. `stock_movements_reason_check` gains 'copy' (the 0163 copy rows),
--    widened from its live definition so a reason added elsewhere is kept.
--
-- Apply BEFORE deploying any F-87 code: the product, taxonomy, coupon and
-- top-up queries select (and Drizzle inserts list) every column.
-- Hand-written, additive and idempotent: safe to re-run.

-- ── 1. platform_switches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_switches (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  changed_at timestamptz,
  changed_by uuid
);

ALTER TABLE public.platform_switches ENABLE ROW LEVEL SECURITY;

INSERT INTO public.platform_switches (key, enabled)
VALUES ('stores_catalog_split', false), ('stores_wallet_split', false)
ON CONFLICT (key) DO NOTHING;

-- ── 2. products.store_id ─────────────────────────────────────────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_store_id_fkey') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_store_status_idx
  ON public.products (store_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS products_store_created_idx
  ON public.products (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS products_store_trashed_idx
  ON public.products (store_id, deleted_at)
  WHERE deleted_at IS NOT NULL AND purged_at IS NULL;

-- ── 3. product_store_split ───────────────────────────────────────────────
-- kind 'kept': the store that keeps the original row (old_id = new_id);
-- 'copy': a new row for another store; 'orphan': a product no store showed,
-- kept by the primary store as a draft (prev_status = its status before).
CREATE TABLE IF NOT EXISTS public.product_store_split (
  entity text NOT NULL,
  old_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  new_id uuid NOT NULL,
  kind text NOT NULL,
  prev_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_store_split_pkey PRIMARY KEY (entity, old_id, store_id),
  CONSTRAINT product_store_split_entity_check CHECK (entity IN (
    'product', 'variant', 'seller_category', 'seller_brand',
    'cross_sell', 'quantity_offer', 'coupon', 'review', 'question'
  )),
  CONSTRAINT product_store_split_kind_check CHECK (kind IN ('kept', 'copy', 'orphan'))
);

CREATE UNIQUE INDEX IF NOT EXISTS product_store_split_new_key
  ON public.product_store_split (entity, new_id);

ALTER TABLE public.product_store_split ENABLE ROW LEVEL SECURITY;

-- ── 4. store_id on taxonomy, coupons and top-ups ─────────────────────────
ALTER TABLE public.seller_product_categories ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.seller_product_brands ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.seller_categories ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE public.seller_wallet_top_ups ADD COLUMN IF NOT EXISTS store_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_product_categories_store_id_fkey') THEN
    ALTER TABLE public.seller_product_categories
      ADD CONSTRAINT seller_product_categories_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_product_brands_store_id_fkey') THEN
    ALTER TABLE public.seller_product_brands
      ADD CONSTRAINT seller_product_brands_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_categories_store_id_fkey') THEN
    ALTER TABLE public.seller_categories
      ADD CONSTRAINT seller_categories_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_store_id_fkey') THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_wallet_top_ups_store_id_fkey') THEN
    ALTER TABLE public.seller_wallet_top_ups
      ADD CONSTRAINT seller_wallet_top_ups_store_id_fkey FOREIGN KEY (store_id)
      REFERENCES public.stores(id) ON DELETE NO ACTION;
  END IF;
END $$;

-- ── 5. stores.activated_at ───────────────────────────────────────────────
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- ── 6. stock movement reason 'copy' ──────────────────────────────────────
-- Widened from the live definition (`reason = ANY (ARRAY[...])`), so it is
-- always a superset. Skipped when 'copy' is already there or the check is
-- missing or not in the array form this rewrite expects.
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def
  FROM pg_constraint
  WHERE conname = 'stock_movements_reason_check'
    AND conrelid = to_regclass('public.stock_movements');
  IF def IS NULL THEN
    RAISE NOTICE '0160: stock_movements_reason_check not found, skipped';
  ELSIF def LIKE '%''copy''%' THEN
    NULL;
  ELSIF def NOT LIKE '%ARRAY[%' THEN
    RAISE NOTICE '0160: stock_movements_reason_check has an unexpected form, skipped: %', def;
  ELSE
    EXECUTE 'ALTER TABLE public.stock_movements DROP CONSTRAINT stock_movements_reason_check';
    EXECUTE 'ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_reason_check ' ||
      regexp_replace(def, '\]', ', ''copy''::text]');
  END IF;
END $$;
