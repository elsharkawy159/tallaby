-- 0171: Nested store categories, two levels (ROADMAP.md F-95;
-- docs/superpowers/specs/2026-11-14-nested-store-categories-design.md).
--
-- A store category (`seller_product_categories`, per store since 0163) may now
-- sit under one main category: `parent_id`. Two levels only: a main category
-- (parent_id NULL) holds sub-categories; a sub-category has no children.
-- Deleting a main category never deletes its sub-categories: they become main
-- categories (ON DELETE SET NULL). Products keep pointing at one category
-- (`products.seller_category_id`), a main one or a sub-category.
--
-- The trigger `seller_product_categories_parent_guard` enforces, on every
-- insert and on updates of parent_id / store_id / seller_id:
--   * a category is not its own parent;
--   * the parent is in the same store and of the same seller;
--   * the parent is a main category (its own parent_id IS NULL);
--   * a category that has sub-categories can't be given a parent;
--   * a category that has sub-categories can't move to another store/seller.
-- Errors are SQLSTATE 23514 (check_violation). The parent row is read FOR SHARE,
-- so two concurrent edits can't build a third level.
--
-- Names stay unique per store, now among siblings: the unique index on
-- (store_id, lower(btrim(name))) becomes (store_id, coalesce(parent_id, nil),
-- lower(btrim(name))). That is strictly looser, so it can't fail on existing
-- rows (all have parent_id NULL). The new index is made before the old one is
-- dropped.
--
-- Additive and idempotent: every existing row keeps parent_id NULL, so every
-- store behaves as before. Drizzle selects every column of this table, so
-- apply on staging, then production (owner approval), BEFORE deploying the code
-- that ships with it.
--
-- Notes on the 0163 split scripts (already applied on staging and production):
-- 0163's copy step copies every column but id/store_id, so re-running it on a
-- database that already has sub-categories would copy a parent_id from another
-- store and this trigger would refuse it; 0163 skips itself once
-- `stores_catalog_split` is on, so this only matters on a fresh rebuild, where
-- 0163 runs before 0171. scripts/stores-split-rollback.sql recreates the
-- per-seller name key (seller_id, lower(btrim(name))), which fails if two
-- sub-categories of one seller share a name; that rollback is only valid before
-- 0165 and before any store uses sub-categories.

ALTER TABLE public.seller_product_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_product_categories_parent_id_fkey') THEN
    ALTER TABLE public.seller_product_categories
      ADD CONSTRAINT seller_product_categories_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.seller_product_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- The FK's lookup on parent delete, and "children of X" reads.
CREATE INDEX IF NOT EXISTS seller_product_categories_parent_idx
  ON public.seller_product_categories (parent_id) WHERE parent_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.seller_product_categories_parent_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_parent record;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'seller_product_categories: % can''t be its own parent', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT p.id, p.seller_id, p.store_id, p.parent_id INTO v_parent
    FROM seller_product_categories p
    WHERE p.id = NEW.parent_id
    FOR SHARE;

    IF NOT FOUND THEN
      -- The FK reports a missing parent; nothing more to check here.
      RETURN NEW;
    END IF;
    IF v_parent.seller_id <> NEW.seller_id OR v_parent.store_id IS DISTINCT FROM NEW.store_id THEN
      RAISE EXCEPTION 'seller_product_categories: parent % is in another store', NEW.parent_id
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_parent.parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'seller_product_categories: parent % is a sub-category (two levels only)', NEW.parent_id
        USING ERRCODE = 'check_violation';
    END IF;
    IF TG_OP = 'UPDATE' AND EXISTS (SELECT 1 FROM seller_product_categories c WHERE c.parent_id = NEW.id) THEN
      RAISE EXCEPTION 'seller_product_categories: % has sub-categories and can''t get a parent', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND (NEW.store_id IS DISTINCT FROM OLD.store_id OR NEW.seller_id IS DISTINCT FROM OLD.seller_id)
     AND EXISTS (SELECT 1 FROM seller_product_categories c WHERE c.parent_id = NEW.id) THEN
    RAISE EXCEPTION 'seller_product_categories: % has sub-categories and can''t move to another store', NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_product_categories_parent_guard ON public.seller_product_categories;
CREATE TRIGGER seller_product_categories_parent_guard
  BEFORE INSERT OR UPDATE OF parent_id, store_id, seller_id ON public.seller_product_categories
  FOR EACH ROW EXECUTE FUNCTION public.seller_product_categories_parent_guard();

-- Unique names among siblings (top level counts as one parent). New first, then drop the old one.
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_store_parent_name_key
  ON public.seller_product_categories (
    store_id,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(btrim(name))
  );
DROP INDEX IF EXISTS public.seller_product_categories_store_name_key;
