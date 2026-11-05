-- 0152: close the public write hole on the `sellers` storage bucket.
--
-- WHY
--   The `sellers` bucket (store logos, banners, category/brand images and the
--   sellers' legal document scans) had four policies for role {public}:
--   "Public wpu2fo_0" SELECT, "Public00 wpu2fo_0" INSERT, "Public wpu2fo_2"
--   UPDATE and "Public wpu2fo_3" DELETE, each only `bucket_id = 'sellers'`.
--   So anyone, signed in or not, could list, upload, overwrite or delete any
--   seller's files.
--
-- WHAT
--   * Drops those four policies.
--   * Adds owner-only policies for `authenticated`: a signed-in user may
--     INSERT, UPDATE and DELETE only `<folder>/<auth.uid()>/<file>` where
--     <folder> is logos, banners or documents
--     ((storage.foldername(name))[1] = folder, [2] = auth.uid()).
--   * Adds a narrow SELECT on the same own folder. Storage's delete/update
--     read the row first (RLS needs a SELECT policy for that); it lets a
--     seller list only their own folder.
--   * No public SELECT/list policy. The bucket stays `public = true`, so the
--     public object URLs (/storage/v1/object/public/sellers/...) of every
--     existing logo, banner and document keep working: public-bucket reads do
--     not go through RLS. Existing files are not moved; older flat paths
--     (`logos/<file>`) stay readable but can no longer be written by anyone
--     except the service role.
--
-- WHO WRITES (after this code deploys)
--   * Dashboard (`useSellerUpload`): a server action checks the session and
--     signs an upload for `<folder>/<sellerId>/<file>` with the service role
--     (createSellersBucketUploadUrl); the browser uploads with that token.
--     Signed uploads do not depend on these policies.
--   * tallaby.com onboarding (`uploadSellerImage`): the browser's own session
--     uploads to `logos|banners/<auth.uid()>/<file>`; these policies apply.
--
-- PRODUCTION TIMING: apply RIGHT AFTER the deploy that carries this code,
--   never before. The code on production before it (origin/main 19f0897c)
--   uploads from the browser as `anon` (dashboard cookies are httpOnly) to
--   flat paths (`logos/<file>`, `banners/<file>`, `documents/<file>`); with
--   0152 applied those uploads fail. The new code works with or without
--   0152, so: deploy dashboard + ecommerce, then apply 0152 at once. No
--   temporary compatibility policy: one that still let `anon` write would
--   keep the hole open.
--
-- Idempotent: DROP POLICY IF EXISTS before every CREATE.
-- Rollback (re-opens the hole; only if uploads break and a fix cannot ship):
--   drop the five "sellers: owners …" policies and re-create the four
--   {public} policies above with `bucket_id = 'sellers'`.

BEGIN;

DROP POLICY IF EXISTS "Public wpu2fo_0" ON storage.objects;
DROP POLICY IF EXISTS "Public00 wpu2fo_0" ON storage.objects;
DROP POLICY IF EXISTS "Public wpu2fo_2" ON storage.objects;
DROP POLICY IF EXISTS "Public wpu2fo_3" ON storage.objects;

DROP POLICY IF EXISTS "sellers: owners can read own" ON storage.objects;
CREATE POLICY "sellers: owners can read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners', 'documents')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "sellers: owners can upload" ON storage.objects;
CREATE POLICY "sellers: owners can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners', 'documents')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "sellers: owners can update" ON storage.objects;
CREATE POLICY "sellers: owners can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners', 'documents')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners', 'documents')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "sellers: owners can delete" ON storage.objects;
CREATE POLICY "sellers: owners can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners', 'documents')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

COMMIT;
