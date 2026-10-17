-- 0051_store_builder_core.sql (PLAN.md §11.3, P1-02)
--
-- Website builder storage, mirroring the Valorcy reference so the editor ports
-- cleanly: design_systems → store_design_systems, website_pages → store_pages.
-- Tallaby addition: store_site_revisions, immutable publish snapshots. Publish
-- writes one revision (validated SiteConfig, @workspace/store-sections) and
-- moves stores.published_revision_id in the same transaction, so a multi-page
-- publish is atomic and public rendering never reads drafts.
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS store_design_systems (
  store_id uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  colors jsonb NOT NULL DEFAULT '{}',
  typography jsonb NOT NULL DEFAULT '{}',
  spacing jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);  -- No custom_css column: seller CSS is not allowed (CLAUDE.md rule 9).

ALTER TABLE store_design_systems ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS store_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slug text NOT NULL,                                   -- 'home' for the home page
  is_home boolean NOT NULL DEFAULT false,
  name jsonb NOT NULL DEFAULT '{}',                     -- {ar, en}
  seo jsonb NOT NULL DEFAULT '{}',
  draft_content jsonb NOT NULL DEFAULT '{"sections":[]}',
  draft_version integer NOT NULL DEFAULT 1,             -- optimistic concurrency for autosave
  use_shared_header boolean NOT NULL DEFAULT true,
  use_shared_footer boolean NOT NULL DEFAULT true,
  show_in_nav boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_pages_slug_format CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$')
);

CREATE UNIQUE INDEX IF NOT EXISTS store_pages_store_slug_key ON store_pages (store_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS store_pages_one_home ON store_pages (store_id) WHERE is_home;
CREATE INDEX IF NOT EXISTS store_pages_store_order_idx ON store_pages (store_id, order_index);

ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS store_site_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  schema_version integer NOT NULL,
  template_key text NOT NULL,
  snapshot jsonb NOT NULL,          -- validated SiteConfig: design system, header, footer, settings, pages[]
  published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_site_revisions_number_positive CHECK (revision_number > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS store_site_revisions_store_number_key
  ON store_site_revisions (store_id, revision_number);

ALTER TABLE store_site_revisions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE stores ADD CONSTRAINT stores_published_revision_id_fkey
    FOREIGN KEY (published_revision_id) REFERENCES store_site_revisions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- The published revision must belong to the same store.
CREATE OR REPLACE FUNCTION stores_published_revision_same_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.published_revision_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM store_site_revisions r
    WHERE r.id = NEW.published_revision_id AND r.store_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'stores: revision % does not belong to store %', NEW.published_revision_id, NEW.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_published_revision_same_store ON stores;
CREATE TRIGGER stores_published_revision_same_store
  BEFORE INSERT OR UPDATE OF published_revision_id ON stores
  FOR EACH ROW EXECUTE FUNCTION stores_published_revision_same_store();

-- Revisions are append-only. Restoring an old one copies it into the drafts and
-- publishes a NEW revision. A DELETE is allowed only when the store itself is
-- gone (the ON DELETE CASCADE from stores).
CREATE OR REPLACE FUNCTION store_site_revisions_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM stores WHERE id = OLD.store_id) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'store_site_revisions is append-only; publish a new revision instead of %', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS store_site_revisions_immutable ON store_site_revisions;
CREATE TRIGGER store_site_revisions_immutable
  BEFORE UPDATE OR DELETE ON store_site_revisions
  FOR EACH ROW EXECUTE FUNCTION store_site_revisions_immutable();

-- Rollback: ALTER TABLE stores DROP CONSTRAINT stores_published_revision_id_fkey;
--   DROP TRIGGER stores_published_revision_same_store ON stores;
--   DROP TABLE store_site_revisions, store_pages, store_design_systems; DROP the two functions.
