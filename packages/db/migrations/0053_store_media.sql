-- 0053_store_media.sql (PLAN.md §11.5, P1-02 / P1-06)
--
-- Seller media library (reference: media_folders / media_assets), saved
-- builder blocks (reference: saved_blocks) and the public `store-media`
-- Storage bucket.
--
-- Media belongs to the SELLER account; store_id NULL = shared by all of the
-- seller's stores. Object paths: '{seller_id}/{store_id|shared}/{uuid}.{ext}'.
-- The browser uploads directly (same pattern as use-seller-upload.ts), so the
-- Storage policies only allow writes under the caller's own '{auth.uid()}/'
-- folder (sellers.id = users.id). A server action then records the
-- media_assets row after checking the path prefix, size and type.
--
-- SVG is not allowed: a public bucket would serve seller-supplied SVG, which
-- can carry script.
--
-- Idempotent. Tables: RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES media_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_folders_name_length CHECK (char_length(name) BETWEEN 1 AND 120)
);

CREATE INDEX IF NOT EXISTS media_folders_seller_idx ON media_folders (seller_id, store_id);
CREATE INDEX IF NOT EXISTS media_folders_parent_idx ON media_folders (parent_id);

ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES media_folders(id) ON DELETE SET NULL,
  bucket text NOT NULL DEFAULT 'store-media',
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  bytes bigint NOT NULL,
  width integer,
  height integer,
  alt_text jsonb NOT NULL DEFAULT '{}',                 -- {ar, en}
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_bucket_path_key UNIQUE (bucket, storage_path),
  CONSTRAINT media_assets_bytes_check CHECK (bytes >= 0),
  -- The path must start with the owner's folder, like the Storage policy.
  CONSTRAINT media_assets_path_owner CHECK (storage_path LIKE seller_id::text || '/%')
);

CREATE INDEX IF NOT EXISTS media_assets_seller_created_idx ON media_assets (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS media_assets_store_idx ON media_assets (store_id);
CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON media_assets (folder_id);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- A folder and its store must belong to the same seller as the asset/folder.
CREATE OR REPLACE FUNCTION media_same_seller()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.store_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM stores WHERE id = NEW.store_id AND seller_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION '%: store % does not belong to seller %', TG_TABLE_NAME, NEW.store_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_TABLE_NAME = 'media_assets' THEN
    IF NEW.folder_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM media_folders WHERE id = NEW.folder_id AND seller_id = NEW.seller_id
    ) THEN
      RAISE EXCEPTION 'media_assets: folder % does not belong to seller %', NEW.folder_id, NEW.seller_id
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM media_folders WHERE id = NEW.parent_id AND seller_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'media_folders: parent % does not belong to seller %', NEW.parent_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS media_folders_same_seller ON media_folders;
CREATE TRIGGER media_folders_same_seller
  BEFORE INSERT OR UPDATE ON media_folders
  FOR EACH ROW EXECUTE FUNCTION media_same_seller();

DROP TRIGGER IF EXISTS media_assets_same_seller ON media_assets;
CREATE TRIGGER media_assets_same_seller
  BEFORE INSERT OR UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION media_same_seller();

CREATE TABLE IF NOT EXISTS saved_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name varchar(200) NOT NULL,
  description text,
  block_type varchar(40) NOT NULL DEFAULT 'section',
  content jsonb NOT NULL,                               -- a validated SectionInstance
  thumbnail_url text,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_blocks_store_idx ON saved_blocks (store_id, updated_at DESC);

ALTER TABLE saved_blocks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for storefront imagery (5 MB, raster images only)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media', 'store-media', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Writes only inside the caller's own top-level folder. Public read is implicit
-- for a public bucket (served from the public URL); no SELECT policy is needed
-- for that, and listing other sellers' folders is not allowed.
DROP POLICY IF EXISTS "store-media: owners can upload" ON storage.objects;
CREATE POLICY "store-media: owners can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "store-media: owners can update" ON storage.objects;
CREATE POLICY "store-media: owners can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'store-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "store-media: owners can delete" ON storage.objects;
CREATE POLICY "store-media: owners can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Owners may read their own objects through the API (needed for upsert/remove).
DROP POLICY IF EXISTS "store-media: owners can read own" ON storage.objects;
CREATE POLICY "store-media: owners can read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Acceptance test after applying (P1-06): as seller A, uploading to
-- 'store-media/{A}/shared/x.png' succeeds and to 'store-media/{B}/shared/x.png' fails.
-- Rollback: DROP the four storage policies; DELETE FROM storage.buckets WHERE id = 'store-media'
--   (only when empty); DROP TABLE saved_blocks, media_assets, media_folders; DROP FUNCTION media_same_seller.
