-- 0153: close the public write holes on the `products`, `brands`,
-- `categories` and `avatars` storage buckets (the same fix 0152 made for
-- `sellers`).
--
-- WHY
--   These public buckets had policies for role {public} (anyone, signed in or
--   not) on storage.objects, each only `bucket_id = '<bucket>'`:
--     products   "Public Access to all 1ifhysk_0 1ifhysk_0" INSERT, "… 1ifhysk_1"
--                SELECT, "… 1ifhysk_2" UPDATE, "… 1ifhysk_3" DELETE
--     brands     "Public 1c6vs24_0" SELECT, "_1" INSERT, "_2" UPDATE, "_3" DELETE
--     categories "Public lfwun0_0" SELECT, "_1" INSERT, "_2" UPDATE, "_3" DELETE
--     avatars    "Anyone can upload an avatar." INSERT,
--                "Avatar images are publicly accessible." SELECT
--   So anyone could list every product, brand and category image, upload,
--   overwrite or delete any of them, and upload anything into `avatars`.
--
-- WHAT
--   * Drops all twelve {public} policies above (SELECT too: it only allowed
--     listing; nothing lists these buckets from a browser).
--   * products, brands, categories: NO policies at all. Every write now goes
--     through the service role on the server, which bypasses RLS:
--       - Dashboard browser uploads (product form, product table, rich-text
--         images, AI autofill photos) get a signed upload URL from the server
--         action createProductImageUploadUrl for
--         `<sellerId>/<YYYY-MM-DD>/<file>` (requireSeller first).
--       - Dashboard server writers (image import route, Shopify import,
--         file import, AI Store Builder upload) and the backend MCP image tool
--         upload with the service role after their seller check.
--       - Admin browser uploads (brand, category and product images) get a
--         signed upload URL from createAdminImageUploadUrl (admin check
--         first), keeping the `<YYYY-MM-DD>/<file>` layout.
--       - Store review photos/videos (ecommerce) get a signed upload URL from
--         createReviewUploadUrl for `reviews/<userId>/<file>`.
--   * avatars: owner-only policies for `authenticated` on `<auth.uid()>/<file>`
--     (SELECT own, INSERT own, DELETE own). The two writers (ecommerce
--     uploadAvatar, shipping rider avatar) are server actions with the user's
--     own session, so these policies apply to them. SELECT is needed for
--     delete (RLS reads the row first) and lets a user list only their folder.
--   * All four buckets stay `public = true`, so every existing public URL
--     (/storage/v1/object/public/<bucket>/...) keeps working: public-bucket
--     reads do not go through RLS. No file is moved; old flat paths
--     (`<YYYY-MM-DD>/<file>`, `reviews/<file>`, `avatars/<id>-<ts>.<ext>`) stay
--     readable, and only the service role can change them now.
--
-- PRODUCTION TIMING: apply RIGHT AFTER the deploy that carries this code
--   (dashboard, admin, ecommerce, shipping), never before. The code on
--   production before it (origin/main 19f0897c) uploads product, brand,
--   category and review images from the browser as `anon` (dashboard and
--   admin cookies are httpOnly) to flat paths, the dashboard image import
--   and Shopify import upload with the session client (`authenticated`), and
--   avatars go to `avatars/<id>-<ts>` (not the user's own folder). With 0153
--   applied all of those fail. The new code works with or without 0153
--   (signed uploads and the service role do not depend on policies; the new
--   avatar path fits both the old INSERT policy and the new one), so: deploy
--   all four apps, then apply 0153 at once. No temporary compatibility
--   policy: one that still let `anon` write would keep the hole open.
--
-- Idempotent: DROP POLICY IF EXISTS before every CREATE.
-- Rollback (re-opens the holes; only if uploads break and a fix cannot ship):
--   drop the three "avatars: owners …" policies and re-create the twelve
--   {public} policies above with their `bucket_id = '<bucket>'` checks.

BEGIN;

-- products
DROP POLICY IF EXISTS "Public Access to all 1ifhysk_0 1ifhysk_0" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to all 1ifhysk_0 1ifhysk_1" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to all 1ifhysk_0 1ifhysk_2" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to all 1ifhysk_0 1ifhysk_3" ON storage.objects;

-- brands
DROP POLICY IF EXISTS "Public 1c6vs24_0" ON storage.objects;
DROP POLICY IF EXISTS "Public 1c6vs24_1" ON storage.objects;
DROP POLICY IF EXISTS "Public 1c6vs24_2" ON storage.objects;
DROP POLICY IF EXISTS "Public 1c6vs24_3" ON storage.objects;

-- categories
DROP POLICY IF EXISTS "Public lfwun0_0" ON storage.objects;
DROP POLICY IF EXISTS "Public lfwun0_1" ON storage.objects;
DROP POLICY IF EXISTS "Public lfwun0_2" ON storage.objects;
DROP POLICY IF EXISTS "Public lfwun0_3" ON storage.objects;

-- avatars
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;

DROP POLICY IF EXISTS "avatars: owners can read own" ON storage.objects;
CREATE POLICY "avatars: owners can read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "avatars: owners can upload" ON storage.objects;
CREATE POLICY "avatars: owners can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "avatars: owners can delete" ON storage.objects;
CREATE POLICY "avatars: owners can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

COMMIT;
