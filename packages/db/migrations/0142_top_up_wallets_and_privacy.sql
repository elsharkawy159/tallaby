-- 0142: more manual top-up wallets, and each account's own privacy text (owner, 2026-11-03).
--
-- seller_wallet_top_ups.provider has no check constraint, so new methods can be
-- stored already. Three places name the manual methods and must learn the new ones:
-- the Admin review index, the Admin bell trigger and the seller bell trigger.
--
-- sellers.privacy_policy: blank means the store shows the general default text.
--
-- Additive and idempotent. Old code ignores the column and only ever sends the two old methods.

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS privacy_policy text;

DROP INDEX IF EXISTS public.seller_wallet_top_ups_review_idx;
CREATE INDEX IF NOT EXISTS seller_wallet_top_ups_review_idx
  ON public.seller_wallet_top_ups (created_at)
  WHERE status = 'pending'
    AND provider IN ('instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay');

CREATE OR REPLACE FUNCTION public.notify_admin_top_up_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.status <> 'pending'
    OR new.provider NOT IN ('instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay') THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    SELECT
      'top_up_requested',
      jsonb_build_object(
        'amount', new.amount::text,
        'method', new.provider,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name)
      ),
      new.seller_id,
      'top_up_requested:' || new.id::text
    FROM public.sellers s
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_top_up_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_seller ON public.seller_wallet_top_ups;
CREATE TRIGGER seller_wallet_top_ups_notify_seller
  AFTER UPDATE OF status ON public.seller_wallet_top_ups
  FOR EACH ROW
  WHEN (
    old.status = 'pending'
    AND new.status IN ('succeeded', 'failed')
    AND new.provider IN ('instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay')
  )
  EXECUTE FUNCTION public.notify_seller_top_up_reviewed();

-- Rollback: ALTER TABLE public.sellers DROP COLUMN privacy_policy; restore the
-- index, function and trigger from 0066 and 0098 (only with no pending rows from the new methods).
