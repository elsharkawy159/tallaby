-- 0157_account_deletion_requests.sql (owner request 2026-11-06; ROADMAP.md F-82, docs/google-play-plan.md GP-02)
--
-- Google Play requires an app with sign-up to let people delete their account,
-- in the app and through a web link. Owner's rules (2026-11-06):
--   * "delete the account from the user's perspective but keep the data for
--     30 days": on request the account CLOSES at once (seller suspended, auth
--     user banned, signed out everywhere, storefronts stop resolving), and the
--     data is purged 30 days later by the dashboard's account-deletions cron;
--   * "he loses all wallet balance on delete": nothing is paid out; the
--     wallet is frozen with the account and goes with the purge.
-- Within the 30 days the team can restore the account from Admin (the seller
-- emails support); restoring puts back the seller status saved here.
--
--   * account_deletion_requests: server-only (RLS on, no policies). At most one
--     SCHEDULED request per user (partial unique index). `user_id` is SET NULL
--     when the user is purged, so the row stays as the record of the deletion;
--     `email` and `display_name` are snapshots taken at the request.
--   * admin bell: an AFTER INSERT trigger adds an `account_deletion_requested`
--     row, like 0156's `theme_requested`. The type check is widened from its
--     LIVE definition (as 0143 and 0156 do), so no other type is lost.
--
-- Additive and idempotent. The dashboard (close account, purge cron, renewal
-- jobs) and the Admin sidebar read this table, so apply it on staging, then
-- production, BEFORE deploying.

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  email text
    CONSTRAINT account_deletion_requests_email_check CHECK (email IS NULL OR char_length(email) <= 320),
  display_name text
    CONSTRAINT account_deletion_requests_display_name_check CHECK (display_name IS NULL OR char_length(display_name) <= 200),
  reason text
    CONSTRAINT account_deletion_requests_reason_check CHECK (reason IS NULL OR char_length(reason) <= 1000),
  -- Where the request came from: the dashboard (web or the Play app).
  source text NOT NULL DEFAULT 'dashboard'
    CONSTRAINT account_deletion_requests_source_check CHECK (source IN ('dashboard', 'android_app')),
  -- scheduled: account closed, data waiting for the purge; completed: purged; restored: reopened by admin.
  status text NOT NULL DEFAULT 'scheduled'
    CONSTRAINT account_deletion_requests_status_check CHECK (status IN ('scheduled', 'completed', 'restored')),
  -- When the purge cron may delete the user (request time + 30 days).
  purge_after timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  -- sellers.status before the account was closed, put back on restore.
  previous_seller_status text,
  admin_note text
    CONSTRAINT account_deletion_requests_admin_note_check CHECK (admin_note IS NULL OR char_length(admin_note) <= 1000),
  handled_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_requests_one_scheduled_idx
  ON public.account_deletion_requests (user_id) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS account_deletion_requests_status_created_idx
  ON public.account_deletion_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS account_deletion_requests_due_idx
  ON public.account_deletion_requests (purge_after) WHERE status = 'scheduled';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Admin bell type, widened from the live definition.
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'admin_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%account_deletion_requested%' THEN
    EXECUTE 'ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_type_check';
    EXECUTE 'ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''account_deletion_requested''::text]');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admin_account_deletion_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'account_deletion_requested',
      jsonb_build_object('requestId', new.id, 'sellerName', coalesce(new.display_name, new.email)),
      s.id,
      NULL,
      'account_deletion_requested:' || new.id::text
    FROM (SELECT 1) AS one
    LEFT JOIN public.sellers s ON s.id = new.user_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- The bell never blocks the request.
    RAISE WARNING 'notify_admin_account_deletion_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_account_deletion_requested() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS account_deletion_requests_notify_admin ON public.account_deletion_requests;
CREATE TRIGGER account_deletion_requests_notify_admin
  AFTER INSERT ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_account_deletion_requested();

COMMIT;

-- Rollback: DROP TABLE public.account_deletion_requests;
--   DROP FUNCTION public.notify_admin_account_deletion_requested();
--   leave `account_deletion_requested` in the type check (a superset is harmless).
