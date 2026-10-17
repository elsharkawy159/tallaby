-- 0055_store_cms.sql (PLAN.md §11.7, §8.5, §8.9, P1-02)
--
-- Per-store CMS (reference: cms_collections / cms_items / cms_item_revisions).
-- The blog is a system collection (kind = 'blog'). The product catalog stays in
-- products/categories, not in the CMS.
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS cms_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'custom',                  -- custom | blog | faq | …
  name text NOT NULL,
  slug varchar(128) NOT NULL,
  description text,
  icon text,
  fields jsonb NOT NULL DEFAULT '[]',
  primary_field_key text,
  slug_field_key text,
  settings jsonb NOT NULL DEFAULT '{}',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cms_collections_store_slug_key UNIQUE (store_id, slug),
  CONSTRAINT cms_collections_slug_format CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$')
);

ALTER TABLE cms_collections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slug varchar(200) NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  data jsonb NOT NULL DEFAULT '{}',
  seo jsonb NOT NULL DEFAULT '{}',
  published_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cms_items_collection_slug_key UNIQUE (collection_id, slug),
  CONSTRAINT cms_items_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS cms_items_store_collection_status_idx
  ON cms_items (store_id, collection_id, status, order_index);

ALTER TABLE cms_items ENABLE ROW LEVEL SECURITY;

-- An item's store_id must equal its collection's store_id.
CREATE OR REPLACE FUNCTION cms_items_same_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cms_collections WHERE id = NEW.collection_id AND store_id = NEW.store_id) THEN
    RAISE EXCEPTION 'cms_items: collection % does not belong to store %', NEW.collection_id, NEW.store_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cms_items_same_store ON cms_items;
CREATE TRIGGER cms_items_same_store
  BEFORE INSERT OR UPDATE OF store_id, collection_id ON cms_items
  FOR EACH ROW EXECUTE FUNCTION cms_items_same_store();

CREATE TABLE IF NOT EXISTS cms_item_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES cms_items(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  reason text NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_item_revisions_item_idx ON cms_item_revisions (item_id, created_at DESC);

ALTER TABLE cms_item_revisions ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE cms_item_revisions, cms_items, cms_collections; DROP FUNCTION cms_items_same_store.
