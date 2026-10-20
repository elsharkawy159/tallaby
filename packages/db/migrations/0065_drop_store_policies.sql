-- 0065_drop_store_policies.sql (owner request 2026-10-18)
--
-- Store settings › Policies is removed: a store's return, shipping, privacy
-- and terms pages are built as website-builder pages instead. This drops
-- stores.policies (0050) and takes it out of the primary-store ↔ seller
-- profile sync triggers (0050 §6a, §6f), which referenced it.
--
-- The account-level sellers.return_policy / shipping_policy stay (marketplace
-- store page, checkout, admin, /settings). They are no longer mirrored into
-- the primary store. On staging only 2 primary stores had policies, and
-- both were already mirrored in sellers, so nothing is lost there.
--
-- DESTRUCTIVE (drops a column). Idempotent: functions are replaced, triggers
-- re-created and the column dropped IF EXISTS. The triggers are re-created
-- first because stores_sync_seller_profile listed the column in UPDATE OF.

BEGIN;

-- 6a. New seller → primary store, without policies.
CREATE OR REPLACE FUNCTION sellers_create_primary_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO stores (
    seller_id, name, subdomain, is_primary, logo_url, banner_url, description,
    store_category, store_category_ar, contact, subdomain_updated_at
  )
  SELECT
    NEW.id, NEW.display_name, NEW.subdomain, true, NEW.logo_url, NEW.banner_url,
    COALESCE(NEW.store_description, NEW.description), NEW.store_category, NEW.store_category_ar,
    jsonb_strip_nulls(jsonb_build_object('email', NEW.support_email, 'phone', NEW.support_phone)),
    NEW.subdomain_updated_at
  WHERE NOT EXISTS (SELECT 1 FROM stores WHERE seller_id = NEW.id AND is_primary);
  RETURN NEW;
END;
$$;

-- 6f. Seller → primary store profile, without policies.
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
      updated_at = now()
  WHERE st.seller_id = NEW.id AND st.is_primary
    AND (st.name, st.description, st.logo_url, st.banner_url, st.store_category, st.store_category_ar,
         st.contact->>'email', st.contact->>'phone')
        IS DISTINCT FROM
        (NEW.display_name, new_description, NEW.logo_url, NEW.banner_url, NEW.store_category, NEW.store_category_ar,
         NULLIF(NEW.support_email, ''), NULLIF(NEW.support_phone, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sellers_sync_primary_store_profile ON sellers;
CREATE TRIGGER sellers_sync_primary_store_profile
  AFTER UPDATE OF display_name, store_description, description, logo_url, banner_url, store_category,
    store_category_ar, support_email, support_phone ON sellers
  FOR EACH ROW EXECUTE FUNCTION sellers_sync_primary_store_profile();

-- 6f. Primary store → seller profile, without policies.
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
      updated_at = now()
  WHERE s.id = NEW.seller_id
    AND (s.display_name, COALESCE(s.store_description, s.description), s.logo_url, s.banner_url,
         s.store_category, s.store_category_ar, NULLIF(s.support_email, ''), NULLIF(s.support_phone, ''))
        IS DISTINCT FROM
        (NEW.name, NEW.description, NEW.logo_url, NEW.banner_url, NEW.store_category, NEW.store_category_ar,
         NEW.contact->>'email', NEW.contact->>'phone');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_sync_seller_profile ON stores;
CREATE TRIGGER stores_sync_seller_profile
  AFTER UPDATE OF name, description, logo_url, banner_url, store_category, store_category_ar, contact
  ON stores
  FOR EACH ROW EXECUTE FUNCTION stores_sync_seller_profile();

ALTER TABLE stores DROP COLUMN IF EXISTS policies;

COMMIT;
