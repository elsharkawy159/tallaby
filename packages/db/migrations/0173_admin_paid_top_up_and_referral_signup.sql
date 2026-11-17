-- 0173: two more Admin bell rows (owner, 2026-11-17; ROADMAP.md F-96).
--
-- 1. `top_up_paid`: a store-wallet top-up paid online (Kashier today; any
--    provider that is not a manual method) reached `succeeded`. The real path is
--    the backend Kashier webhook (apps/backend/src/routes/kashier.ts) calling
--    applyStoreTopUpWebhook in packages/lib/src/store-wallet/top-up.server.ts,
--    which UPDATEs the row from pending/processing to succeeded in the same
--    transaction as the wallet credit. A row inserted already succeeded is
--    covered too. Manual top-ups (InstaPay, wallets) are left out: they already
--    ring `top_up_requested` (0142) and an admin approves them by hand.
--    data = { amount (EGP paid, text), currency, creditAmount, creditCurrency
--    (what the wallet got, USD since the switch), method, sellerName };
--    dedupe_key `top_up_paid:<top-up id>`, so a replayed webhook adds nothing.
-- 2. `referral_signup`: a seller signed up through another seller's referral
--    link (sellers.referred_by_seller_id set on INSERT, or later from NULL).
--    data = { sellerName, referrerId, referrerName }; seller_id = the new
--    seller; dedupe_key `referral_signup:<seller id>`.
--
-- Additive and idempotent: the type check is widened from its live definition
-- (guarded), functions are CREATE OR REPLACE and triggers DROP IF EXISTS first.
-- Errors are caught and raised as warnings, so the bell never blocks a top-up
-- or a signup. Existing triggers are untouched. The admin push dispatcher
-- (0131 webhook on admin_notifications INSERT) pushes the new rows like the
-- others. Older admin code shows an unknown type as a plain "Notification"
-- with no link, so deploy order does not matter.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_admin_paid ON public.seller_wallet_top_ups;
--   DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_admin_paid_insert ON public.seller_wallet_top_ups;
--   DROP TRIGGER IF EXISTS sellers_notify_admin_referral_signup ON public.sellers;
--   DROP TRIGGER IF EXISTS sellers_notify_admin_referral_signup_update ON public.sellers;
--   DROP FUNCTION IF EXISTS public.notify_admin_top_up_paid();
--   DROP FUNCTION IF EXISTS public.notify_admin_referral_signup();
--   DELETE FROM public.admin_notifications WHERE type IN ('top_up_paid', 'referral_signup');
--   then rebuild admin_notifications_type_check without the two types.

-- Admin bell types, widened from the live definition (a superset of it).
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'admin_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%top_up_paid%' THEN
    EXECUTE 'ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_type_check';
    EXECUTE 'ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''top_up_paid''::text]');
  END IF;
END $$;

DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'admin_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%referral_signup%' THEN
    EXECUTE 'ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_type_check';
    EXECUTE 'ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''referral_signup''::text]');
  END IF;
END $$;

-- 1. A top-up paid online succeeded.
CREATE OR REPLACE FUNCTION public.notify_admin_top_up_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  -- The triggers' WHEN clauses say the same; kept here so a direct call is safe.
  IF new.status <> 'succeeded'
    OR new.provider IN ('instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay') THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    SELECT
      'top_up_paid',
      jsonb_build_object(
        'amount', new.amount::text,
        'currency', new.currency,
        'creditAmount', new.credit_amount::text,
        'creditCurrency', new.credit_currency,
        'method', new.provider,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name)
      ),
      new.seller_id,
      'top_up_paid:' || new.id::text
    FROM public.sellers s
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- The bell never blocks the top-up.
    RAISE WARNING 'notify_admin_top_up_paid: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_top_up_paid() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_admin_paid ON public.seller_wallet_top_ups;
CREATE TRIGGER seller_wallet_top_ups_notify_admin_paid
  AFTER UPDATE OF status ON public.seller_wallet_top_ups
  FOR EACH ROW
  WHEN (
    new.status = 'succeeded'
    AND old.status IS DISTINCT FROM new.status
    AND new.provider NOT IN ('instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay')
  )
  EXECUTE FUNCTION public.notify_admin_top_up_paid();

DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_admin_paid_insert ON public.seller_wallet_top_ups;
CREATE TRIGGER seller_wallet_top_ups_notify_admin_paid_insert
  AFTER INSERT ON public.seller_wallet_top_ups
  FOR EACH ROW
  WHEN (
    new.status = 'succeeded'
    AND new.provider NOT IN ('instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay')
  )
  EXECUTE FUNCTION public.notify_admin_top_up_paid();

-- 2. A seller signed up through a referral link.
CREATE OR REPLACE FUNCTION public.notify_admin_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.referred_by_seller_id IS NULL THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    SELECT
      'referral_signup',
      jsonb_build_object(
        'sellerName', coalesce(nullif(new.display_name, ''), new.business_name),
        'referrerId', new.referred_by_seller_id,
        'referrerName', coalesce(nullif(r.display_name, ''), r.business_name)
      ),
      new.id,
      'referral_signup:' || new.id::text
    FROM (SELECT 1) AS one
    LEFT JOIN public.sellers r ON r.id = new.referred_by_seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- The bell never blocks the signup.
    RAISE WARNING 'notify_admin_referral_signup: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_referral_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sellers_notify_admin_referral_signup ON public.sellers;
CREATE TRIGGER sellers_notify_admin_referral_signup
  AFTER INSERT ON public.sellers
  FOR EACH ROW
  WHEN (new.referred_by_seller_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_admin_referral_signup();

DROP TRIGGER IF EXISTS sellers_notify_admin_referral_signup_update ON public.sellers;
CREATE TRIGGER sellers_notify_admin_referral_signup_update
  AFTER UPDATE OF referred_by_seller_id ON public.sellers
  FOR EACH ROW
  WHEN (old.referred_by_seller_id IS NULL AND new.referred_by_seller_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_admin_referral_signup();
