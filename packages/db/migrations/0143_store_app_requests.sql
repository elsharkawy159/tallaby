-- 0143_store_app_requests.sql (owner, 2026-11-04; ROADMAP.md F-62)
--
-- A seller asks for an app that isn't open to everyone yet (today: SMS), once per
-- store, and an admin enables or declines it. Server-only: RLS on, no policies.
-- Each request adds an `app_requested` row to the admin bell.
--
-- Additive and idempotent. The dashboard Apps page and the Admin sidebar read this
-- table, so apply it before deploying.

BEGIN;

CREATE TABLE IF NOT EXISTS public.store_app_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  app_key text NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CONSTRAINT store_app_requests_status_check CHECK (status IN ('requested', 'enabled', 'declined')),
  requested_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_app_requests_store_app_key UNIQUE (store_id, app_key)
);

CREATE INDEX IF NOT EXISTS store_app_requests_seller_idx ON public.store_app_requests (seller_id);
CREATE INDEX IF NOT EXISTS store_app_requests_open_idx
  ON public.store_app_requests (created_at) WHERE status = 'requested';

ALTER TABLE public.store_app_requests ENABLE ROW LEVEL SECURITY;

-- Widen the live definition, so a type another migration added is never lost.
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'admin_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%app_requested%' THEN
    EXECUTE 'ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_type_check';
    EXECUTE 'ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''app_requested''::text]');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admin_app_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'app_requested',
      jsonb_build_object(
        'appKey', new.app_key,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name),
        'storeName', st.name
      ),
      new.seller_id,
      new.store_id,
      'app_requested:' || new.id::text
    FROM public.sellers s
    JOIN public.stores st ON st.id = new.store_id
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_app_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS store_app_requests_notify_admin ON public.store_app_requests;
CREATE TRIGGER store_app_requests_notify_admin
  AFTER INSERT ON public.store_app_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_app_requested();

COMMIT;

-- Rollback: DROP TABLE public.store_app_requests;
--   DROP FUNCTION public.notify_admin_app_requested();
--   leave `app_requested` in the type check (a superset is harmless).
