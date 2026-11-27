-- 0189_digital_products_bucket.sql (ROADMAP.md F-108a: digital products in the seller form)
--
-- A seller can mark a product Digital in the dashboard product form and upload
-- the files a buyer downloads. Files live in the PRIVATE `digital-products`
-- bucket (`DIGITAL_PRODUCTS_BUCKET` in @workspace/db/supabase/service) with NO
-- storage policies: the dashboard signs one upload per exact path
-- `<sellerId>/<storeId>/<uuid>-<safe name>` after checking that the session
-- seller owns the store, and the save checks every path again; downloads keep
-- going through short-lived signed links minted by server code (service role).
--
-- 100 MB per file. allowed_mime_types stays NULL on purpose: DXF, DWG and PLT
-- files have no reliable MIME type, so the code checks the file extension
-- (apps/dashboard/.../products/_digital/digital-files.lib.ts).
--
-- Additive and idempotent. If the bucket already exists it is made private
-- with these limits; no row of storage.objects is touched. No table or column
-- change, so no Drizzle schema change and no deploy-order dependency for the
-- tables (the form simply can't upload until the bucket exists).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('digital-products', 'digital-products', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 104857600,
      allowed_mime_types = NULL;

-- Read-only check: this bucket must have no storage policies. Lists any found
-- (they would let browsers read or write files directly); drop them by hand.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (coalesce(qual, '') LIKE '%digital-products%' OR coalesce(with_check, '') LIKE '%digital-products%')
  LOOP
    RAISE NOTICE '0189: storage.objects policy % mentions digital-products; review and drop it', p.policyname;
  END LOOP;
END $$;

-- Rollback: UPDATE storage.buckets SET file_size_limit = NULL WHERE id = 'digital-products';
-- (never delete the bucket while it holds files buyers can download).
