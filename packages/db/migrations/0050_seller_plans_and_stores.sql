-- 0050_seller_plans_and_stores.sql (PLAN.md §11.2, P1-02 + P1-07)
--
-- Splits the ACCOUNT from the TENANT:
--   sellers  = account (plan, wallet, fee trial, legal data). sellers.id = users.id.
--   stores   = tenant (subdomain, custom domain, branding, pages, theme, …).
--              A seller owns up to plan.maxStores stores (Free = 3, limits in
--              packages/lib/src/plans). Exactly one is the primary store.
--
-- Backfill: one primary store per existing seller with the same subdomain and
-- identity, so nothing changes for buyers or sellers.
--
-- Compatibility layer (P1-07), done with triggers so every legacy write path
-- (the ecommerce /onboarding wizard, admin, the dashboard subdomain setting)
-- keeps the new columns right without code changes:
--   * a new sellers row automatically gets its primary store;
--   * sellers.subdomain and the primary store's subdomain stay equal in both
--     directions;
--   * store_id is filled on new seller_subdomain_redirects,
--     seller_custom_domains, carts (storefront) and storefront orders when the
--     writer did not set it.
--
-- Idempotent (IF NOT EXISTS, CREATE OR REPLACE, NOT EXISTS backfills), like 0044.
-- RLS enabled with no policies: server-side Drizzle access only.

-- ---------------------------------------------------------------------------
-- 1. Account plan
-- ---------------------------------------------------------------------------
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS plan_started_at timestamptz NOT NULL DEFAULT now();
-- NULL for free; used by future subscriptions.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
-- Audited admin override of plan.maxStores (D27). NULL = use the plan limit.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS max_stores_override integer;

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_max_stores_override_check
    CHECK (max_stores_override IS NULL OR max_stores_override >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. stores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  subdomain text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',            -- active | archived | suspended
  deleted_at timestamptz,                           -- soft delete (admin only)
  logo_url text,
  favicon_url text,
  banner_url text,
  description text,
  store_category text,
  store_category_ar text,
  default_locale text NOT NULL DEFAULT 'ar',
  supported_locales text[] NOT NULL DEFAULT ARRAY['ar', 'en'],
  contact jsonb NOT NULL DEFAULT '{}',              -- phone, email, whatsapp, social
  policies jsonb NOT NULL DEFAULT '{}',             -- return / shipping / privacy / terms
  seo jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',             -- payments, shipping (Zod-validated in app)
  catalog_mode text NOT NULL DEFAULT 'all',         -- all | selected (store_products)
  template_key text NOT NULL DEFAULT 'tallaby-classic',
  previous_template_key text,
  site_status text NOT NULL DEFAULT 'draft',        -- builder site: draft | published | unpublished
  schema_version integer NOT NULL DEFAULT 1,
  shared_header jsonb,                              -- draft chrome (reference: websites.shared_*)
  shared_footer jsonb,
  published_revision_id uuid,                       -- FK added in 0051
  first_published_at timestamptz,
  last_published_at timestamptz,
  subdomain_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stores_status_check CHECK (status IN ('active', 'archived', 'suspended')),
  CONSTRAINT stores_catalog_mode_check CHECK (catalog_mode IN ('all', 'selected')),
  CONSTRAINT stores_site_status_check CHECK (site_status IN ('draft', 'published', 'unpublished')),
  CONSTRAINT stores_default_locale_check CHECK (default_locale IN ('ar', 'en')),
  -- Same rule as sellers_subdomain_format (0044) and packages/lib/src/storefront.
  CONSTRAINT stores_subdomain_format CHECK (
    subdomain ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
    AND position('--' IN subdomain) = 0
    AND NOT is_reserved_subdomain(subdomain)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS stores_subdomain_key ON stores (subdomain);
CREATE UNIQUE INDEX IF NOT EXISTS stores_one_primary ON stores (seller_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS stores_seller_idx ON stores (seller_id) WHERE deleted_at IS NULL;

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- A new subdomain must not collide with any store either (not only sellers and
-- old links). Replaces the 0044 function; same signature and behaviour.
CREATE OR REPLACE FUNCTION generate_seller_subdomain(source text, for_seller uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  candidate text;
  n integer := 1;
BEGIN
  base := lower(coalesce(source, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(BOTH '-' FROM left(trim(BOTH '-' FROM base), 28));

  IF length(base) < 3 OR is_reserved_subdomain(base) THEN
    base := 'store-' || left(replace(for_seller::text, '-', ''), 8);
  END IF;

  candidate := base;
  WHILE EXISTS (SELECT 1 FROM sellers WHERE subdomain = candidate AND id <> for_seller)
     OR EXISTS (SELECT 1 FROM seller_subdomain_redirects WHERE subdomain = candidate AND seller_id <> for_seller)
     OR EXISTS (SELECT 1 FROM stores WHERE subdomain = candidate AND seller_id <> for_seller)
  LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;

  RETURN candidate;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Backfill: one primary store per existing seller
-- ---------------------------------------------------------------------------
INSERT INTO stores (
  seller_id, name, subdomain, is_primary, logo_url, banner_url, description,
  store_category, store_category_ar, contact, policies, subdomain_updated_at, created_at
)
SELECT
  s.id,
  s.display_name,
  s.subdomain,
  true,
  s.logo_url,
  s.banner_url,
  COALESCE(s.store_description, s.description),
  s.store_category,
  s.store_category_ar,
  jsonb_strip_nulls(jsonb_build_object('email', s.support_email, 'phone', s.support_phone)),
  jsonb_strip_nulls(jsonb_build_object('return', s.return_policy, 'shipping', s.shipping_policy)),
  s.subdomain_updated_at,
  COALESCE(s.created_at, now())
FROM sellers s
WHERE NOT EXISTS (SELECT 1 FROM stores t WHERE t.seller_id = s.id AND t.is_primary);

-- ---------------------------------------------------------------------------
-- 4. store_id on existing per-seller rows (nullable, backfilled to the primary store)
-- ---------------------------------------------------------------------------
ALTER TABLE seller_subdomain_redirects ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE seller_custom_domains ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;

UPDATE seller_subdomain_redirects r SET store_id = st.id
FROM stores st
WHERE r.store_id IS NULL AND st.seller_id = r.seller_id AND st.is_primary;

UPDATE seller_custom_domains d SET store_id = st.id
FROM stores st
WHERE d.store_id IS NULL AND st.seller_id = d.seller_id AND st.is_primary;

-- Storefront carts only; marketplace carts (store_seller_id NULL) keep store_id NULL.
UPDATE carts c SET store_id = st.id
FROM stores st
WHERE c.store_id IS NULL AND c.store_seller_id IS NOT NULL
  AND st.seller_id = c.store_seller_id AND st.is_primary;

-- Storefront orders only; marketplace orders keep store_id NULL.
-- (a) through the order's cart, (b) fallback through the items' seller
-- (a storefront cart only ever holds one seller's products).
UPDATE orders o SET store_id = c.store_id
FROM carts c
WHERE o.store_id IS NULL AND o.order_source = 'storefront'
  AND o.cart_id = c.id AND c.store_id IS NOT NULL;

UPDATE orders o SET store_id = st.id
FROM (
  SELECT oi.order_id, min(oi.seller_id::text)::uuid AS seller_id
  FROM order_items oi
  GROUP BY oi.order_id
  HAVING count(DISTINCT oi.seller_id) = 1
) one_seller
JOIN stores st ON st.seller_id = one_seller.seller_id AND st.is_primary
WHERE o.store_id IS NULL AND o.order_source = 'storefront' AND o.id = one_seller.order_id;

-- One custom domain per store. The per-seller unique index
-- seller_custom_domains_seller_id_key stays until P3-03b (needs approval).
CREATE UNIQUE INDEX IF NOT EXISTS seller_custom_domains_store_id_key ON seller_custom_domains (store_id);
CREATE INDEX IF NOT EXISTS seller_subdomain_redirects_store_id_idx ON seller_subdomain_redirects (store_id);
CREATE INDEX IF NOT EXISTS carts_user_store_id_status_idx ON carts (user_id, store_id, status);
CREATE INDEX IF NOT EXISTS orders_store_id_idx ON orders (store_id) WHERE store_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. store_products: the store's selected catalog (used only when catalog_mode = 'selected')
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_products (
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, product_id)
);
CREATE INDEX IF NOT EXISTS store_products_product_idx ON store_products (product_id);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

-- A store may only list its own seller's products (also checked in the app).
CREATE OR REPLACE FUNCTION store_products_same_seller()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stores st JOIN products p ON p.seller_id = st.seller_id
    WHERE st.id = NEW.store_id AND p.id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'store_products: product % does not belong to the seller of store %',
      NEW.product_id, NEW.store_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_products_same_seller ON store_products;
CREATE TRIGGER store_products_same_seller
  BEFORE INSERT OR UPDATE ON store_products
  FOR EACH ROW EXECUTE FUNCTION store_products_same_seller();

-- ---------------------------------------------------------------------------
-- 6. Compatibility triggers (P1-07)
-- ---------------------------------------------------------------------------

-- 6a. Every new seller gets its primary store. AFTER INSERT, so the 0044
--     BEFORE trigger has already assigned sellers.subdomain.
CREATE OR REPLACE FUNCTION sellers_create_primary_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO stores (
    seller_id, name, subdomain, is_primary, logo_url, banner_url, description,
    store_category, store_category_ar, contact, policies, subdomain_updated_at
  )
  SELECT
    NEW.id, NEW.display_name, NEW.subdomain, true, NEW.logo_url, NEW.banner_url,
    COALESCE(NEW.store_description, NEW.description), NEW.store_category, NEW.store_category_ar,
    jsonb_strip_nulls(jsonb_build_object('email', NEW.support_email, 'phone', NEW.support_phone)),
    jsonb_strip_nulls(jsonb_build_object('return', NEW.return_policy, 'shipping', NEW.shipping_policy)),
    NEW.subdomain_updated_at
  WHERE NOT EXISTS (SELECT 1 FROM stores WHERE seller_id = NEW.id AND is_primary);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sellers_create_primary_store ON sellers;
CREATE TRIGGER sellers_create_primary_store
  AFTER INSERT ON sellers
  FOR EACH ROW EXECUTE FUNCTION sellers_create_primary_store();

-- 6b. sellers.subdomain → primary store (legacy updateStoreSubdomain path).
CREATE OR REPLACE FUNCTION sellers_sync_primary_store_subdomain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE stores
  SET subdomain = NEW.subdomain,
      subdomain_updated_at = COALESCE(NEW.subdomain_updated_at, now()),
      updated_at = now()
  WHERE seller_id = NEW.id AND is_primary AND subdomain IS DISTINCT FROM NEW.subdomain;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sellers_sync_primary_store_subdomain ON sellers;
CREATE TRIGGER sellers_sync_primary_store_subdomain
  AFTER UPDATE OF subdomain ON sellers
  FOR EACH ROW
  WHEN (OLD.subdomain IS DISTINCT FROM NEW.subdomain)
  EXECUTE FUNCTION sellers_sync_primary_store_subdomain();

-- 6c. Primary store subdomain → sellers.subdomain (new store write path).
--     The IS DISTINCT FROM guards stop the two triggers from looping.
CREATE OR REPLACE FUNCTION stores_sync_seller_subdomain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE sellers
    SET subdomain = NEW.subdomain,
        subdomain_updated_at = COALESCE(NEW.subdomain_updated_at, now())
    WHERE id = NEW.seller_id AND subdomain IS DISTINCT FROM NEW.subdomain;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_sync_seller_subdomain ON stores;
CREATE TRIGGER stores_sync_seller_subdomain
  AFTER UPDATE OF subdomain, is_primary ON stores
  FOR EACH ROW EXECUTE FUNCTION stores_sync_seller_subdomain();

-- 6d. Fill store_id from the seller's primary store when a legacy writer omits it.
CREATE OR REPLACE FUNCTION fill_store_id_from_primary()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  owner uuid;
BEGIN
  IF NEW.store_id IS NULL THEN
    IF TG_TABLE_NAME = 'carts' THEN
      owner := NEW.store_seller_id;     -- NULL for marketplace carts → stays NULL
    ELSE
      owner := NEW.seller_id;
    END IF;
    IF owner IS NOT NULL THEN
      SELECT id INTO NEW.store_id FROM stores WHERE seller_id = owner AND is_primary;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_subdomain_redirects_fill_store_id ON seller_subdomain_redirects;
CREATE TRIGGER seller_subdomain_redirects_fill_store_id
  BEFORE INSERT ON seller_subdomain_redirects
  FOR EACH ROW EXECUTE FUNCTION fill_store_id_from_primary();

DROP TRIGGER IF EXISTS seller_custom_domains_fill_store_id ON seller_custom_domains;
CREATE TRIGGER seller_custom_domains_fill_store_id
  BEFORE INSERT ON seller_custom_domains
  FOR EACH ROW EXECUTE FUNCTION fill_store_id_from_primary();

DROP TRIGGER IF EXISTS carts_fill_store_id ON carts;
CREATE TRIGGER carts_fill_store_id
  BEFORE INSERT ON carts
  FOR EACH ROW EXECUTE FUNCTION fill_store_id_from_primary();

-- 6e. Storefront orders inherit the cart's store.
CREATE OR REPLACE FUNCTION orders_fill_store_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.store_id IS NULL AND NEW.order_source = 'storefront' AND NEW.cart_id IS NOT NULL THEN
    SELECT store_id INTO NEW.store_id FROM carts WHERE id = NEW.cart_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_fill_store_id ON orders;
CREATE TRIGGER orders_fill_store_id
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_fill_store_id();

-- 6f. Storefront profile of the PRIMARY store, in both directions, until the
--     storefront reads stores (P5-00). The ecommerce storefront still reads
--     these sellers columns; admin and the old /settings page still write them.
--       stores.name            ↔ sellers.display_name
--       stores.description     ↔ sellers.store_description (falls back to description)
--       logo_url, banner_url, store_category, store_category_ar ↔ same columns
--       stores.contact.email   ↔ sellers.support_email ('' when removed; NOT NULL)
--       stores.contact.phone   ↔ sellers.support_phone
--       stores.policies.return / .shipping ↔ sellers.return_policy / shipping_policy
--     Each side only writes when a value differs, so the pair settles after one hop.
CREATE OR REPLACE FUNCTION sellers_sync_primary_store_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_description text := COALESCE(NEW.store_description, NEW.description);
BEGIN
  UPDATE stores st
  SET name = NEW.display_name,
      description = new_description,
      logo_url = NEW.logo_url,
      banner_url = NEW.banner_url,
      store_category = NEW.store_category,
      store_category_ar = NEW.store_category_ar,
      contact = jsonb_strip_nulls(st.contact || jsonb_build_object(
        'email', NULLIF(NEW.support_email, ''), 'phone', NULLIF(NEW.support_phone, ''))),
      policies = jsonb_strip_nulls(st.policies || jsonb_build_object(
        'return', NULLIF(NEW.return_policy, ''), 'shipping', NULLIF(NEW.shipping_policy, ''))),
      updated_at = now()
  WHERE st.seller_id = NEW.id AND st.is_primary
    AND (st.name, st.description, st.logo_url, st.banner_url, st.store_category, st.store_category_ar,
         st.contact->>'email', st.contact->>'phone', st.policies->>'return', st.policies->>'shipping')
        IS DISTINCT FROM
        (NEW.display_name, new_description, NEW.logo_url, NEW.banner_url, NEW.store_category, NEW.store_category_ar,
         NULLIF(NEW.support_email, ''), NULLIF(NEW.support_phone, ''),
         NULLIF(NEW.return_policy, ''), NULLIF(NEW.shipping_policy, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sellers_sync_primary_store_profile ON sellers;
CREATE TRIGGER sellers_sync_primary_store_profile
  AFTER UPDATE OF display_name, store_description, description, logo_url, banner_url, store_category,
    store_category_ar, support_email, support_phone, return_policy, shipping_policy ON sellers
  FOR EACH ROW EXECUTE FUNCTION sellers_sync_primary_store_profile();

CREATE OR REPLACE FUNCTION stores_sync_seller_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT NEW.is_primary THEN
    RETURN NEW;
  END IF;
  UPDATE sellers s
  SET display_name = NEW.name,
      store_description = NEW.description,
      logo_url = NEW.logo_url,
      banner_url = NEW.banner_url,
      store_category = NEW.store_category,
      store_category_ar = NEW.store_category_ar,
      support_email = COALESCE(NEW.contact->>'email', ''),
      support_phone = NEW.contact->>'phone',
      return_policy = NEW.policies->>'return',
      shipping_policy = NEW.policies->>'shipping',
      updated_at = now()
  WHERE s.id = NEW.seller_id
    AND (s.display_name, COALESCE(s.store_description, s.description), s.logo_url, s.banner_url,
         s.store_category, s.store_category_ar, NULLIF(s.support_email, ''), NULLIF(s.support_phone, ''),
         NULLIF(s.return_policy, ''), NULLIF(s.shipping_policy, ''))
        IS DISTINCT FROM
        (NEW.name, NEW.description, NEW.logo_url, NEW.banner_url, NEW.store_category, NEW.store_category_ar,
         NEW.contact->>'email', NEW.contact->>'phone', NEW.policies->>'return', NEW.policies->>'shipping');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_sync_seller_profile ON stores;
CREATE TRIGGER stores_sync_seller_profile
  AFTER UPDATE OF name, description, logo_url, banner_url, store_category, store_category_ar, contact, policies
  ON stores
  FOR EACH ROW EXECUTE FUNCTION stores_sync_seller_profile();

-- ---------------------------------------------------------------------------
-- Checks after applying (PLAN.md §11.11.2), each should return 0 rows:
--   SELECT id FROM sellers s WHERE NOT EXISTS (SELECT 1 FROM stores t WHERE t.seller_id = s.id AND t.is_primary);
--   SELECT s.id FROM sellers s JOIN stores t ON t.seller_id = s.id AND t.is_primary WHERE t.subdomain <> s.subdomain;
--   SELECT subdomain FROM seller_subdomain_redirects WHERE store_id IS NULL;
--   SELECT id FROM seller_custom_domains WHERE store_id IS NULL;
--   SELECT id FROM carts WHERE store_seller_id IS NOT NULL AND store_id IS NULL;
--   SELECT id FROM orders WHERE order_source = 'storefront' AND store_id IS NULL;
-- Rollback: DROP the triggers/functions of section 6, DROP TABLE store_products, stores CASCADE;
--   DROP the four store_id columns and the sellers plan columns; restore generate_seller_subdomain from 0044.
