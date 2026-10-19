-- 0068_seller_categories_brands.sql (owner request 2026-10-18)
--
-- Each seller keeps their own list of categories and brands (Products ›
-- Categories & brands). The admin-curated `categories` and `brands` tables are
-- only a "pack" to pick from: picking copies the name into the seller's list
-- and remembers where it came from; sellers can also add their own. Lists are
-- per seller (shared by all their stores, like products) and never shared with
-- other sellers.
--
-- Products keep their required marketplace category_id / brand_id. The two new
-- optional columns point at the seller's own items, for grouping products on
-- the seller's storefronts. Additive and idempotent.

-- ---------------------------------------------------------------------------
-- 1. The seller's own categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  -- The pack item it was picked from; NULL for the seller's own.
  source_category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_product_categories_name_check CHECK (length(btrim(name)) BETWEEN 1 AND 80)
);

-- No duplicate names in one seller's list, and each pack item at most once.
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_name_key
  ON seller_product_categories (seller_id, lower(btrim(name)));
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_source_key
  ON seller_product_categories (seller_id, source_category_id) WHERE source_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seller_product_categories_seller_idx
  ON seller_product_categories (seller_id, position);

ALTER TABLE seller_product_categories ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. The seller's own brands
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_product_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  source_brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  logo_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_product_brands_name_check CHECK (length(btrim(name)) BETWEEN 1 AND 80)
);

CREATE UNIQUE INDEX IF NOT EXISTS seller_product_brands_name_key
  ON seller_product_brands (seller_id, lower(btrim(name)));
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_brands_source_key
  ON seller_product_brands (seller_id, source_brand_id) WHERE source_brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seller_product_brands_seller_idx
  ON seller_product_brands (seller_id, position);

ALTER TABLE seller_product_brands ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Products: optional links to the seller's own items
-- ---------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_category_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_brand_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_seller_category_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_seller_category_id_fkey
      FOREIGN KEY (seller_category_id) REFERENCES seller_product_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_seller_brand_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_seller_brand_id_fkey
      FOREIGN KEY (seller_brand_id) REFERENCES seller_product_brands(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS product_seller_category_id_idx
  ON products (seller_category_id) WHERE seller_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_seller_brand_id_idx
  ON products (seller_brand_id) WHERE seller_brand_id IS NOT NULL;

-- A product may only use its own seller's items (also checked in the app).
CREATE OR REPLACE FUNCTION products_seller_taxonomy_same_seller()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.seller_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM seller_product_categories c
    WHERE c.id = NEW.seller_category_id AND c.seller_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'products: seller category % does not belong to seller %',
      NEW.seller_category_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.seller_brand_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM seller_product_brands b
    WHERE b.id = NEW.seller_brand_id AND b.seller_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'products: seller brand % does not belong to seller %',
      NEW.seller_brand_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_seller_taxonomy_same_seller ON products;
CREATE TRIGGER products_seller_taxonomy_same_seller
  BEFORE INSERT OR UPDATE OF seller_category_id, seller_brand_id, seller_id ON products
  FOR EACH ROW EXECUTE FUNCTION products_seller_taxonomy_same_seller();

-- Rollback: DROP TRIGGER products_seller_taxonomy_same_seller ON products;
--   DROP FUNCTION products_seller_taxonomy_same_seller(); ALTER TABLE products
--   DROP COLUMN seller_category_id, DROP COLUMN seller_brand_id;
--   DROP TABLE seller_product_categories, seller_product_brands.
