-- 0156_theme_requests.sql (owner request 2026-11-06; ROADMAP.md F-77)
--
-- "Request a theme": on Website › Templates a seller describes a theme they
-- didn't find (a reference URL, up to 3 images, a description, a note). The
-- Tallaby team builds it into the normal code-only gallery for everyone
-- (CLAUDE.md rule 17, ships with a deploy); this table only tracks the
-- request's status and the admin's reply.
--
--   * theme_requests: server-only (RLS on, no policies). A seller has at most
--     3 open requests (status new | in_progress), checked by the server under
--     an advisory lock.
--   * theme-request-images: a PRIVATE bucket with NO storage policies. The
--     dashboard signs one upload per file into `<sellerId>/<uuid>.<ext>` with
--     the service role; Admin reads them through short-lived signed URLs.
--     5 MB, JPEG/PNG/WebP only (the bucket enforces both).
--   * admin bell: an AFTER INSERT trigger adds a `theme_requested` row, like
--     0143's `app_requested`.
--   * seller bell: `theme_request_updated`, written by Admin when it changes a
--     request's status (in progress, ready, declined); the 0124 dispatcher
--     pushes it like every other seller type.
--
-- Both type checks are widened from their LIVE definition (as 0137, 0139 and
-- 0143 do), so a type another migration added is never lost. At the time of
-- writing the latest lists are: admin = 0098 + 0115 + 0116 + 0117 + 0143
-- (… referral_payout_requested, app_requested); seller = 0133's list +
-- 0137's plan_* + 0139's app_*.
--
-- Additive and idempotent. The dashboard Templates page and the Admin sidebar
-- read this table, so apply it on staging, then production, BEFORE deploying.

BEGIN;

CREATE TABLE IF NOT EXISTS public.theme_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  -- The store the seller was on when asking; the request outlives the store.
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  reference_url text
    CONSTRAINT theme_requests_reference_url_check
      CHECK (reference_url IS NULL OR (reference_url ~ '^https://' AND char_length(reference_url) <= 500)),
  description text
    CONSTRAINT theme_requests_description_check CHECK (description IS NULL OR char_length(description) <= 2000),
  note text
    CONSTRAINT theme_requests_note_check CHECK (note IS NULL OR char_length(note) <= 1000),
  -- Paths in the private theme-request-images bucket (`<sellerId>/<uuid>.<ext>`).
  image_paths text[] NOT NULL DEFAULT '{}'
    CONSTRAINT theme_requests_image_paths_check CHECK (coalesce(cardinality(image_paths), 0) <= 3),
  status text NOT NULL DEFAULT 'new'
    CONSTRAINT theme_requests_status_check CHECK (status IN ('new', 'in_progress', 'ready', 'declined')),
  admin_reply text
    CONSTRAINT theme_requests_admin_reply_check CHECK (admin_reply IS NULL OR char_length(admin_reply) <= 2000),
  requested_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  handled_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- At least one of URL, image or description.
  CONSTRAINT theme_requests_content_check CHECK (
    reference_url IS NOT NULL
    OR coalesce(cardinality(image_paths), 0) > 0
    OR (description IS NOT NULL AND char_length(btrim(description)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS theme_requests_status_created_idx ON public.theme_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS theme_requests_seller_idx ON public.theme_requests (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS theme_requests_store_idx ON public.theme_requests (store_id) WHERE store_id IS NOT NULL;

ALTER TABLE public.theme_requests ENABLE ROW LEVEL SECURITY;

-- Private bucket, no storage policies: only the service role reads or signs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theme-request-images', 'theme-request-images', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Admin bell type, widened from the live definition.
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'admin_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%theme_requested%' THEN
    EXECUTE 'ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_type_check';
    EXECUTE 'ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''theme_requested''::text]');
  END IF;
END $$;

-- Seller bell type, widened from the live definition.
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'seller_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%theme_request_updated%' THEN
    EXECUTE 'ALTER TABLE public.seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''theme_request_updated''::text]');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admin_theme_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'theme_requested',
      jsonb_build_object(
        'requestId', new.id,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name),
        'storeName', st.name
      ),
      new.seller_id,
      new.store_id,
      'theme_requested:' || new.id::text
    FROM public.sellers s
    LEFT JOIN public.stores st ON st.id = new.store_id
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- The bell never blocks the request.
    RAISE WARNING 'notify_admin_theme_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_theme_requested() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS theme_requests_notify_admin ON public.theme_requests;
CREATE TRIGGER theme_requests_notify_admin
  AFTER INSERT ON public.theme_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_theme_requested();

COMMIT;

-- Rollback: DROP TABLE public.theme_requests;
--   DROP FUNCTION public.notify_admin_theme_requested();
--   DELETE FROM storage.buckets WHERE id = 'theme-request-images' (only when empty);
--   leave `theme_requested` / `theme_request_updated` in the type checks (a superset is harmless).
