-- 0073_platform_blog_posts.sql (owner request 2026-10-19)
--
-- The tallaby.com blog (/blog in apps/ecommerce), written from the admin app.
-- Separate from store blogs (cms_items): these are platform posts with no
-- seller or store. One row holds both languages; a locale whose title is empty
-- is not shown on that locale. A post is live when status = 'published' and
-- published_at <= now() (a future published_at schedules it).
--
-- Reads and writes go through Drizzle on the server (admin actions in
-- packages/lib/src/admin/platform-blog.server.ts, the marketing reader in
-- apps/ecommerce/lib/marketing/blog.server.ts) and bypass RLS. RLS is on; the
-- only policy lets verified, unsuspended admins (is_platform_admin()) manage
-- posts through the Supabase API too. Nobody else (anon, sellers, customers)
-- can read or write the table directly. Images live in the public
-- `platform-blog` bucket, which only those admins can write to.
-- Additive and idempotent.

CREATE TABLE IF NOT EXISTS platform_blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  category text NOT NULL DEFAULT 'guides',
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  excerpt_ar text NOT NULL DEFAULT '',
  excerpt_en text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  cover_image text,
  author_name text,
  tags text[] NOT NULL DEFAULT '{}',
  reading_minutes integer,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_blog_posts_slug_check CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 200),
  CONSTRAINT platform_blog_posts_category_check CHECK (category IN ('guides', 'growth', 'stories', 'payments', 'product')),
  CONSTRAINT platform_blog_posts_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT platform_blog_posts_published_check CHECK (
    status = 'draft' OR (published_at IS NOT NULL AND (title_ar <> '' OR title_en <> ''))
  ),
  CONSTRAINT platform_blog_posts_reading_minutes_check CHECK (reading_minutes IS NULL OR reading_minutes BETWEEN 1 AND 600),
  CONSTRAINT platform_blog_posts_seo_check CHECK (jsonb_typeof(seo) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_blog_posts_slug_key ON platform_blog_posts (slug);
CREATE INDEX IF NOT EXISTS platform_blog_posts_published_idx ON platform_blog_posts (status, published_at DESC);

ALTER TABLE platform_blog_posts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for blog covers and inline images (2 MB, raster only)
-- ---------------------------------------------------------------------------

-- Mirrors getCurrentAdminUser() in apps/admin/lib/auth/admin-auth.ts.
-- SECURITY DEFINER so the storage policies can read public.users without the
-- caller gaining any new access of its own.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'::public.user_role
      AND u.is_verified
      AND NOT u.is_suspended
  );
$fn$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS "platform_blog_posts: admins manage" ON platform_blog_posts;
CREATE POLICY "platform_blog_posts: admins manage" ON platform_blog_posts
  FOR ALL TO authenticated
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

-- SVG is not allowed: a public bucket would serve it as a document.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-blog', 'platform-blog', true, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read is implicit for a public bucket (served from the public URL).
DROP POLICY IF EXISTS "platform-blog: admins can upload" ON storage.objects;
CREATE POLICY "platform-blog: admins can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'platform-blog' AND (SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS "platform-blog: admins can update" ON storage.objects;
CREATE POLICY "platform-blog: admins can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'platform-blog' AND (SELECT public.is_platform_admin()))
  WITH CHECK (bucket_id = 'platform-blog' AND (SELECT public.is_platform_admin()));

DROP POLICY IF EXISTS "platform-blog: admins can delete" ON storage.objects;
CREATE POLICY "platform-blog: admins can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'platform-blog' AND (SELECT public.is_platform_admin()));

-- Rollback: DROP the table policy and the three storage policies; DELETE FROM storage.buckets WHERE id = 'platform-blog'
-- (after emptying it); DROP FUNCTION public.is_platform_admin(); DROP TABLE platform_blog_posts;
