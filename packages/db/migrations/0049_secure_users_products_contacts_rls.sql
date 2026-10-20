-- 0049_secure_users_products_contacts_rls.sql
--
-- Closes holes found by the read-only audit of the live project (PLAN.md §23,
-- P0-04 (b), 2026-10-17). All app reads/writes of these tables go through
-- server-side Drizzle (owner role, bypasses RLS) or the service role, except:
--   * admin + shipping read the caller's OWN users row via the session
--     ("Users can read their own profile" is kept);
--   * the ecommerce contact form inserts into contacts via the session
--     ("Enable insert access for all users" is kept).
-- Idempotent: DROP POLICY IF EXISTS and REVOKE can run any number of times.
-- service_role and the table owner are not affected.

BEGIN;

-- 1. users — critical: a signed-in user could UPDATE their own row, including
--    role / is_verified / is_suspended, and the admin app authorizes by
--    users.role + is_verified. No client code writes users through PostgREST.
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;

-- 2. users — high: SELECT USING (true) for everyone exposed every email/phone
--    to the anon key. Own-row read for authenticated users stays.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone." ON public.users;

-- 3. products — high: any signed-in user could INSERT products for any
--    seller_id. "Public full access" / "Allow authenticated insert access"
--    have no expressions (grant nothing) and are dropped to remove ambiguity.
--    Product writes happen only in server code (Drizzle).
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.products;
DROP POLICY IF EXISTS "Public full access" ON public.products;
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;

-- 4. contacts — high: any signed-in user could read every contact-form
--    submission (names, emails, phones, messages). Nothing reads contacts
--    through PostgREST.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.contacts;

COMMIT;

-- Verification (expect 0 rows each):
--   SELECT policyname FROM pg_policies WHERE schemaname = 'public'
--     AND tablename IN ('users','products','contacts') AND (qual = 'true' OR cmd IN ('UPDATE','ALL'));
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--     WHERE table_schema = 'public' AND table_name IN ('users','products')
--       AND grantee IN ('anon','authenticated') AND privilege_type IN ('INSERT','UPDATE','DELETE');
--
-- Rollback (re-opens the holes; only if something unexpected breaks):
--   GRANT INSERT, UPDATE, DELETE ON public.users, public.products TO anon, authenticated;
--   then re-create the dropped policies from packages/db/src/drizzle/schema.ts history.
