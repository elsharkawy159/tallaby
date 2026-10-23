-- 0099_store_pages_kind.sql (template product page, 2026-10-23)
--
-- store_pages.kind: 'page' (default) or 'product'. A store has at most one
-- product page (slug 'product'), the Shopify-style template every product
-- opens with on the storefront. Additive and idempotent.

ALTER TABLE store_pages ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'page';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_pages_kind_check') THEN
    ALTER TABLE store_pages ADD CONSTRAINT store_pages_kind_check CHECK (kind IN ('page', 'product'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS store_pages_one_product
  ON store_pages (store_id) WHERE kind = 'product';
