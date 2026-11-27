-- 0187: drop seller documents, the seller's legal details and the payout account.
--
-- WHAT
--   * Drops the table `public.seller_documents` (its index
--     `seller_docs_seller_id_idx`, its two foreign keys, its RLS policies and
--     any trigger on it go with it).
--   * Drops the columns `sellers.business_type` (text NOT NULL),
--     `sellers.legal_address` (jsonb NOT NULL) and `sellers.payment_details`
--     (jsonb). `business_type` is plain text: there is no enum type to drop.
--   * Narrows 0152's four owner policies on the `sellers` storage bucket from
--     `logos|banners|documents/<auth.uid()>/` to `logos|banners/<auth.uid()>/`,
--     so nobody can upload a new file under `documents/` any more (the service
--     role still can; nothing in the code does).
--
-- WHY (owner, 2026-11-27)
--   The seller account page `/settings` was removed. Policies, Business &
--   contact and Phone alerts moved into Store settings; the documents, legal
--   details, payout account and domain cards were removed. Nothing in the
--   dashboard, admin or storefront reads or writes these any more.
--
-- DEPLOY ORDER: apply ONLY AFTER the code that stops selecting these columns
--   is deployed (dashboard, admin, ecommerce and every other app that imports
--   `@workspace/db`). Drizzle selects every `sellers` column by name, so
--   applying this earlier breaks every seller read on the old code.
--   Staging first, then production with owner approval (CLAUDE.md rules 4, 6).
--   Needs 0186 (columns nullable) first, applied BEFORE that deploy, so
--   seller sign-up keeps working while the columns still exist.
--
-- AFTER 0187: delete the stored files. Supabase blocks deleting
--   `storage.objects` rows with SQL, so run (dry run first, then --apply):
--     node packages/db/scripts/delete-seller-documents-files.mjs
--     node packages/db/scripts/delete-seller-documents-files.mjs --apply
--   with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY of the same
--   project in the environment.
--
-- DESTRUCTIVE: the table rows and the three columns' data are gone for good.
--   Take a backup (or `COPY ... TO`) first if the owner wants to keep them.
--   No rollback beyond restoring from that backup.
--
-- Idempotent: IF EXISTS everywhere; DROP POLICY IF EXISTS before each CREATE.
-- Guarded: aborts, changing nothing, if a view or a public function still
--   names the table or a column (they would break or need CASCADE).

BEGIN;

DO $$
DECLARE
  deps text;
  n_docs bigint;
BEGIN
  -- Views / materialized views built on the table or on the three columns.
  SELECT string_agg(DISTINCT v.oid::regclass::text, ', ') INTO deps
  FROM pg_depend d
  JOIN pg_rewrite r ON r.oid = d.objid
  JOIN pg_class v ON v.oid = r.ev_class
  LEFT JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
  WHERE d.classid = 'pg_rewrite'::regclass
    AND v.oid <> d.refobjid
    AND (
      d.refobjid = to_regclass('public.seller_documents')
      OR (d.refobjid = 'public.sellers'::regclass
          AND a.attname IN ('business_type', 'legal_address', 'payment_details'))
    );
  IF deps IS NOT NULL THEN
    RAISE EXCEPTION '0187: views still depend on seller_documents or the dropped sellers columns: %', deps;
  END IF;

  -- Functions (trigger functions included) whose body names them. plpgsql
  -- bodies are not tracked by pg_depend, so check the source text.
  SELECT string_agg(p.oid::regprocedure::text, ', ') INTO deps
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND p.prosrc ~* '(seller_documents|business_type|legal_address|payment_details)';
  IF deps IS NOT NULL THEN
    RAISE EXCEPTION '0187: functions still name seller_documents or the dropped sellers columns: %', deps;
  END IF;

  IF to_regclass('public.seller_documents') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.seller_documents' INTO n_docs;
    RAISE NOTICE '0187: dropping seller_documents (% rows)', n_docs;
  END IF;
END $$;

DROP TABLE IF EXISTS public.seller_documents;

ALTER TABLE public.sellers DROP COLUMN IF EXISTS business_type;
ALTER TABLE public.sellers DROP COLUMN IF EXISTS legal_address;
ALTER TABLE public.sellers DROP COLUMN IF EXISTS payment_details;

-- 0152's owner policies without `documents`.
DROP POLICY IF EXISTS "sellers: owners can read own" ON storage.objects;
CREATE POLICY "sellers: owners can read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "sellers: owners can upload" ON storage.objects;
CREATE POLICY "sellers: owners can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "sellers: owners can update" ON storage.objects;
CREATE POLICY "sellers: owners can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "sellers: owners can delete" ON storage.objects;
CREATE POLICY "sellers: owners can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'sellers'
    AND (storage.foldername(name))[1] IN ('logos', 'banners')
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

COMMIT;
