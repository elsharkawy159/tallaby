-- 0179: Pre-order on a product (ROADMAP.md F-23b, owner 2026-11-25:
-- "add option to product حجز مسبق and the delivery date").
--
-- products.preorder_enabled   the seller takes orders before the product is in
--                             stock (default false: every existing product
--                             keeps its behaviour).
-- products.preorder_ships_at  the expected delivery date the store shows
--                             (a plain date, Cairo calendar day). Required
--                             while pre-order is on (guarded CHECK).
-- order_items.preorder_ships_at
--                             snapshot of the product's date when the order
--                             was placed (null = not a pre-order line). Set by
--                             the server only (placeOrderFromCart).
--
-- A pre-order product is never stock-counted: it reuses the unlimited-stock
-- path (0138, track_stock = false), so cart, checkout, decrementStock and
-- restoreStock need no new rule. The BEFORE trigger keeps that true for every
-- writer (product form, bulk edit, Excel update, Inventory, MCP tools): while
-- preorder_enabled is true, track_stock is forced to false. Turning pre-order
-- off leaves track_stock as the writer sets it.
--
-- Additive: columns with a constant default or nullable (no table rewrite on
-- PG 11+), a guarded CHECK (NOT VALID, then validated), and a trigger that
-- does nothing until a row has preorder_enabled = true. No row changes. The
-- product and order item queries select every column, so apply it on staging,
-- then production, BEFORE deploying the code that ships with it. Idempotent.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preorder_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preorder_ships_at date;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS preorder_ships_at date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_preorder_date_check') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_preorder_date_check
      CHECK (NOT preorder_enabled OR preorder_ships_at IS NOT NULL) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.products VALIDATE CONSTRAINT products_preorder_date_check;

CREATE OR REPLACE FUNCTION public.products_preorder_untracked()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.preorder_enabled THEN
    NEW.track_stock := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_preorder_untracked ON public.products;
CREATE TRIGGER products_preorder_untracked
  BEFORE INSERT OR UPDATE OF preorder_enabled, track_stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_preorder_untracked();

COMMENT ON COLUMN public.products.preorder_enabled IS
  'Pre-order (F-23b, 0179): orders are taken without stock; forces track_stock = false (trigger products_preorder_untracked).';
COMMENT ON COLUMN public.products.preorder_ships_at IS
  'Pre-order expected delivery date shown on the store (F-23b, 0179); required while preorder_enabled.';
COMMENT ON COLUMN public.order_items.preorder_ships_at IS
  'Snapshot of products.preorder_ships_at when the order was placed (F-23b, 0179); null = not a pre-order line.';
