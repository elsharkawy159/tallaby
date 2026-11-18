-- 0176_tallaby_pay_notifications.sql: Tallaby Pay bell rows for the Admin team
-- and for sellers (ROADMAP.md F-100g; docs/superpowers/specs/2026-11-18-tallaby-pay-design.md
-- §7, §11 and the owner's answers in §14, 2026-11-18).
--
-- Admin bell (admin_notifications; the 0131 webhook pushes new rows):
--   tallaby_pay_payout_requested  a seller asked to withdraw earnings (tallaby_pay_payouts INSERT).
--       data = { payoutId, amount, currency, method, storeName, sellerName }; dedupe `tallaby_pay_payout_requested:<payout id>`.
--   tallaby_pay_kyc_submitted     a seller sent (or re-sent) their legal identity (tallaby_pay_kyc INSERT, or
--       UPDATE back to `submitted`). data = { sellerName, legalName }; dedupe `…:<seller id>:<submitted_at ms>`.
--   tallaby_pay_refund_requested  money to give back from Tallaby's EasyKash account:
--       source `seller` (the seller cancelled a paid order, refund_state → requested),
--       source `paid_after_cancel` (a payment arrived for a cancelled order: the sale is inserted with the request),
--       source `paid_twice` (a second payment for an order already paid: a `payments` row with
--       payment_data.review = 'paid_twice', F-100d). data = { source, amount, currency, orderId, orderNumber, storeName };
--       dedupe `…:<sale id>:<refund_requested_at ms>` or `…:payment:<payment id>`.
--
-- Seller bell (seller_notifications; the 0124/0131 webhook pushes new rows):
--   tallaby_pay_sale_credited       a paid order's net was added to pending earnings (sale INSERT without a refund request).
--   tallaby_pay_earnings_available  the net moved to available (order delivered).
--   tallaby_pay_refunded            Tallaby refunded the customer before delivery.
--   tallaby_pay_refund_declined     an admin declined the seller's refund request (refund_state requested → NULL
--       while the sale stays pending); the money stays the seller's and releases on delivery.
--       Sales data = { saleId, orderId, orderNumber, amount (net), currency, purpose, storeId }; dedupe `<type>:<sale id>`
--       (`…:<refund_requested_at ms>` for a decline, so a new request declined again rings again).
--   tallaby_pay_payout_paid / tallaby_pay_payout_rejected  an admin handled a withdrawal.
--       data = { payoutId, amount, currency, storeId }; dedupe `<type>:<payout id>`.
--   tallaby_pay_kyc_verified / tallaby_pay_kyc_rejected    an admin reviewed the identity.
--       data = { storeId } (the seller's oldest live store with earnings, for the link); dedupe `<type>:<seller id>:<updated_at ms>`.
--
-- Both type checks are widened from their LIVE definition (a superset of it, so
-- this must run after 0172 and 0173), once, only with the types still missing:
-- a re-run changes nothing. Functions are CREATE OR REPLACE, triggers DROP IF
-- EXISTS first. Every insert is ON CONFLICT DO NOTHING and every error is a
-- warning: a bell never blocks a sale, a refund, a withdrawal, a KYC review or
-- a payment. The triggers run in the same transaction as the change, so a
-- rolled-back admin action leaves no bell. Older admin and dashboard code shows
-- an unknown type as a plain notification with no link, so deploy order does
-- not matter. Needs 0175 (the tables).
--
-- Additive and idempotent. NOT applied anywhere yet: staging, then production
-- with owner approval, after 0175.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS tallaby_pay_payouts_notify_admin ON public.tallaby_pay_payouts;
--   DROP TRIGGER IF EXISTS tallaby_pay_payouts_notify_seller ON public.tallaby_pay_payouts;
--   DROP TRIGGER IF EXISTS tallaby_pay_kyc_notify_admin_insert ON public.tallaby_pay_kyc;
--   DROP TRIGGER IF EXISTS tallaby_pay_kyc_notify_admin_update ON public.tallaby_pay_kyc;
--   DROP TRIGGER IF EXISTS tallaby_pay_kyc_notify_seller ON public.tallaby_pay_kyc;
--   DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_admin_insert ON public.tallaby_pay_sales;
--   DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_admin_update ON public.tallaby_pay_sales;
--   DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_seller_insert ON public.tallaby_pay_sales;
--   DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_seller_update ON public.tallaby_pay_sales;
--   DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_seller_declined ON public.tallaby_pay_sales;
--   DROP TRIGGER IF EXISTS payments_notify_admin_tallaby_pay_paid_twice ON public.payments;
--   DROP FUNCTION IF EXISTS public.notify_admin_tallaby_pay_payout_requested();
--   DROP FUNCTION IF EXISTS public.notify_seller_tallaby_pay_payout();
--   DROP FUNCTION IF EXISTS public.notify_admin_tallaby_pay_kyc_submitted();
--   DROP FUNCTION IF EXISTS public.notify_seller_tallaby_pay_kyc();
--   DROP FUNCTION IF EXISTS public.notify_admin_tallaby_pay_refund_requested();
--   DROP FUNCTION IF EXISTS public.notify_seller_tallaby_pay_sale();
--   DROP FUNCTION IF EXISTS public.notify_admin_tallaby_pay_paid_twice();
--   DELETE FROM public.admin_notifications WHERE type LIKE 'tallaby\_pay\_%';
--   DELETE FROM public.seller_notifications WHERE type LIKE 'tallaby\_pay\_%';
--   then rebuild both type checks without the new types.

-- ── Type checks, widened from the live definitions ──────────────────────
DO $$
DECLARE
  def text;
  next_def text;
  t text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint
   WHERE conname = 'admin_notifications_type_check' AND conrelid = 'public.admin_notifications'::regclass;
  IF def IS NULL THEN
    RETURN;
  END IF;
  next_def := def;
  FOREACH t IN ARRAY ARRAY['tallaby_pay_payout_requested', 'tallaby_pay_kyc_submitted', 'tallaby_pay_refund_requested'] LOOP
    IF position('''' || t || '''' IN next_def) = 0 THEN
      next_def := regexp_replace(next_def, '\]', ', ''' || t || '''::text]');
    END IF;
  END LOOP;
  IF next_def <> def THEN
    EXECUTE 'ALTER TABLE public.admin_notifications DROP CONSTRAINT admin_notifications_type_check';
    EXECUTE 'ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check ' || next_def;
  END IF;
END $$;

DO $$
DECLARE
  def text;
  next_def text;
  t text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint
   WHERE conname = 'seller_notifications_type_check' AND conrelid = 'public.seller_notifications'::regclass;
  IF def IS NULL THEN
    RETURN;
  END IF;
  next_def := def;
  FOREACH t IN ARRAY ARRAY[
    'tallaby_pay_sale_credited', 'tallaby_pay_earnings_available', 'tallaby_pay_refunded', 'tallaby_pay_refund_declined',
    'tallaby_pay_payout_paid', 'tallaby_pay_payout_rejected', 'tallaby_pay_kyc_verified', 'tallaby_pay_kyc_rejected'
  ] LOOP
    IF position('''' || t || '''' IN next_def) = 0 THEN
      next_def := regexp_replace(next_def, '\]', ', ''' || t || '''::text]');
    END IF;
  END LOOP;
  IF next_def <> def THEN
    EXECUTE 'ALTER TABLE public.seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check ' || next_def;
  END IF;
END $$;

-- ── Admin: a withdrawal request ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_admin_tallaby_pay_payout_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.status <> 'requested' THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'tallaby_pay_payout_requested',
      jsonb_build_object(
        'payoutId', new.id,
        'amount', new.amount::text,
        'currency', 'EGP',
        'method', new.method,
        'storeName', st.name,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name)
      ),
      new.seller_id,
      new.store_id,
      'tallaby_pay_payout_requested:' || new.id::text
    FROM (SELECT 1) AS one
    LEFT JOIN public.sellers s ON s.id = new.seller_id
    LEFT JOIN public.stores st ON st.id = new.store_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_tallaby_pay_payout_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_tallaby_pay_payout_requested() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tallaby_pay_payouts_notify_admin ON public.tallaby_pay_payouts;
CREATE TRIGGER tallaby_pay_payouts_notify_admin
  AFTER INSERT ON public.tallaby_pay_payouts
  FOR EACH ROW
  WHEN (new.status = 'requested')
  EXECUTE FUNCTION public.notify_admin_tallaby_pay_payout_requested();

-- ── Seller: a withdrawal paid or rejected ───────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_seller_tallaby_pay_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  kind text;
BEGIN
  kind := CASE new.status WHEN 'paid' THEN 'tallaby_pay_payout_paid' WHEN 'rejected' THEN 'tallaby_pay_payout_rejected' END;
  IF kind IS NULL OR old.status IS NOT DISTINCT FROM new.status THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.seller_notifications (seller_id, store_id, type, data, dedupe_key)
    VALUES (
      new.seller_id,
      new.store_id,
      kind,
      jsonb_build_object('payoutId', new.id, 'amount', new.amount::text, 'currency', 'EGP', 'storeId', new.store_id),
      kind || ':' || new.id::text
    )
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_tallaby_pay_payout: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_seller_tallaby_pay_payout() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tallaby_pay_payouts_notify_seller ON public.tallaby_pay_payouts;
CREATE TRIGGER tallaby_pay_payouts_notify_seller
  AFTER UPDATE OF status ON public.tallaby_pay_payouts
  FOR EACH ROW
  WHEN (new.status IN ('paid', 'rejected') AND old.status IS DISTINCT FROM new.status)
  EXECUTE FUNCTION public.notify_seller_tallaby_pay_payout();

-- ── Admin: an identity to review ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_admin_tallaby_pay_kyc_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.status <> 'submitted' THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    SELECT
      'tallaby_pay_kyc_submitted',
      jsonb_build_object(
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name),
        'legalName', new.legal_name
      ),
      new.seller_id,
      'tallaby_pay_kyc_submitted:' || new.seller_id::text || ':'
        || floor(extract(epoch FROM new.submitted_at) * 1000)::bigint::text
    FROM (SELECT 1) AS one
    LEFT JOIN public.sellers s ON s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_tallaby_pay_kyc_submitted: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_tallaby_pay_kyc_submitted() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tallaby_pay_kyc_notify_admin_insert ON public.tallaby_pay_kyc;
CREATE TRIGGER tallaby_pay_kyc_notify_admin_insert
  AFTER INSERT ON public.tallaby_pay_kyc
  FOR EACH ROW
  WHEN (new.status = 'submitted')
  EXECUTE FUNCTION public.notify_admin_tallaby_pay_kyc_submitted();

-- A resubmission after a rejection sets status and submitted_at again (F-100e).
DROP TRIGGER IF EXISTS tallaby_pay_kyc_notify_admin_update ON public.tallaby_pay_kyc;
CREATE TRIGGER tallaby_pay_kyc_notify_admin_update
  AFTER UPDATE OF status, submitted_at ON public.tallaby_pay_kyc
  FOR EACH ROW
  WHEN (
    new.status = 'submitted'
    AND (old.status IS DISTINCT FROM new.status OR old.submitted_at IS DISTINCT FROM new.submitted_at)
  )
  EXECUTE FUNCTION public.notify_admin_tallaby_pay_kyc_submitted();

-- ── Seller: identity verified or rejected ───────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_seller_tallaby_pay_kyc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  kind text;
  link_store uuid;
BEGIN
  kind := CASE new.status WHEN 'verified' THEN 'tallaby_pay_kyc_verified' WHEN 'rejected' THEN 'tallaby_pay_kyc_rejected' END;
  IF kind IS NULL OR old.status IS NOT DISTINCT FROM new.status THEN
    RETURN NULL;
  END IF;
  BEGIN
    -- KYC is per account; the link opens the earnings of the seller's oldest live store that has a wallet.
    SELECT w.store_id INTO link_store
      FROM public.tallaby_pay_wallets w
      JOIN public.stores st ON st.id = w.store_id AND st.deleted_at IS NULL
     WHERE w.seller_id = new.seller_id
     ORDER BY w.created_at
     LIMIT 1;
    INSERT INTO public.seller_notifications (seller_id, store_id, type, data, dedupe_key)
    VALUES (
      new.seller_id,
      link_store,
      kind,
      CASE WHEN link_store IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('storeId', link_store) END,
      kind || ':' || new.seller_id::text || ':' || floor(extract(epoch FROM new.updated_at) * 1000)::bigint::text
    )
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_tallaby_pay_kyc: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_seller_tallaby_pay_kyc() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tallaby_pay_kyc_notify_seller ON public.tallaby_pay_kyc;
CREATE TRIGGER tallaby_pay_kyc_notify_seller
  AFTER UPDATE OF status ON public.tallaby_pay_kyc
  FOR EACH ROW
  WHEN (new.status IN ('verified', 'rejected') AND old.status IS DISTINCT FROM new.status)
  EXECUTE FUNCTION public.notify_seller_tallaby_pay_kyc();

-- ── Admin: a refund to make (seller cancel, paid after cancel) ──────────
CREATE OR REPLACE FUNCTION public.notify_admin_tallaby_pay_refund_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.refund_state IS DISTINCT FROM 'requested' THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'tallaby_pay_refund_requested',
      jsonb_build_object(
        'source', CASE WHEN new.refund_reason = 'paid_after_cancel' THEN 'paid_after_cancel' ELSE 'seller' END,
        'saleId', new.id,
        'amount', new.gross::text,
        'currency', 'EGP',
        'orderId', new.order_id,
        'orderNumber', o.order_number,
        'storeName', st.name
      ),
      new.seller_id,
      new.store_id,
      'tallaby_pay_refund_requested:' || new.id::text || ':'
        || coalesce(floor(extract(epoch FROM new.refund_requested_at) * 1000)::bigint::text, '0')
    FROM (SELECT 1) AS one
    LEFT JOIN public.orders o ON o.id = new.order_id
    LEFT JOIN public.stores st ON st.id = new.store_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_tallaby_pay_refund_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_tallaby_pay_refund_requested() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_admin_insert ON public.tallaby_pay_sales;
CREATE TRIGGER tallaby_pay_sales_notify_admin_insert
  AFTER INSERT ON public.tallaby_pay_sales
  FOR EACH ROW
  WHEN (new.refund_state = 'requested')
  EXECUTE FUNCTION public.notify_admin_tallaby_pay_refund_requested();

DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_admin_update ON public.tallaby_pay_sales;
CREATE TRIGGER tallaby_pay_sales_notify_admin_update
  AFTER UPDATE OF refund_state ON public.tallaby_pay_sales
  FOR EACH ROW
  WHEN (new.refund_state = 'requested' AND old.refund_state IS DISTINCT FROM new.refund_state)
  EXECUTE FUNCTION public.notify_admin_tallaby_pay_refund_requested();

-- ── Seller: a sale credited, available, refunded, refund declined ───────
CREATE OR REPLACE FUNCTION public.notify_seller_tallaby_pay_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  kind text;
  dedupe text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A payment for a cancelled order arrives with its refund request: nothing to celebrate.
    kind := CASE WHEN new.status = 'pending' AND new.refund_state IS NULL THEN 'tallaby_pay_sale_credited' END;
  ELSIF old.status IS DISTINCT FROM new.status THEN
    kind := CASE new.status WHEN 'available' THEN 'tallaby_pay_earnings_available' WHEN 'refunded' THEN 'tallaby_pay_refunded' END;
  ELSIF old.refund_state = 'requested' AND new.refund_state IS NULL AND new.status = 'pending' THEN
    -- An admin refund sets status = 'refunded' in the same UPDATE, so only a decline lands here.
    kind := 'tallaby_pay_refund_declined';
  END IF;
  IF kind IS NULL THEN
    RETURN NULL;
  END IF;
  dedupe := kind || ':' || new.id::text;
  IF kind = 'tallaby_pay_refund_declined' THEN
    dedupe := dedupe || ':' || coalesce(floor(extract(epoch FROM old.refund_requested_at) * 1000)::bigint::text, '0');
  END IF;
  BEGIN
    INSERT INTO public.seller_notifications (seller_id, store_id, type, data, dedupe_key)
    SELECT
      new.seller_id,
      new.store_id,
      kind,
      jsonb_build_object(
        'saleId', new.id,
        'orderId', new.order_id,
        'orderNumber', o.order_number,
        'amount', new.net::text,
        'currency', 'EGP',
        'purpose', new.purpose,
        'storeId', new.store_id
      ),
      dedupe
    FROM (SELECT 1) AS one
    LEFT JOIN public.orders o ON o.id = new.order_id
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_tallaby_pay_sale: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_seller_tallaby_pay_sale() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_seller_insert ON public.tallaby_pay_sales;
CREATE TRIGGER tallaby_pay_sales_notify_seller_insert
  AFTER INSERT ON public.tallaby_pay_sales
  FOR EACH ROW
  WHEN (new.status = 'pending' AND new.refund_state IS NULL)
  EXECUTE FUNCTION public.notify_seller_tallaby_pay_sale();

DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_seller_update ON public.tallaby_pay_sales;
CREATE TRIGGER tallaby_pay_sales_notify_seller_update
  AFTER UPDATE OF status ON public.tallaby_pay_sales
  FOR EACH ROW
  WHEN (new.status IN ('available', 'refunded') AND old.status IS DISTINCT FROM new.status)
  EXECUTE FUNCTION public.notify_seller_tallaby_pay_sale();

DROP TRIGGER IF EXISTS tallaby_pay_sales_notify_seller_declined ON public.tallaby_pay_sales;
CREATE TRIGGER tallaby_pay_sales_notify_seller_declined
  AFTER UPDATE OF refund_state ON public.tallaby_pay_sales
  FOR EACH ROW
  WHEN (old.refund_state = 'requested' AND new.refund_state IS NULL AND new.status = 'pending' AND old.status = 'pending')
  EXECUTE FUNCTION public.notify_seller_tallaby_pay_sale();

-- ── Admin: a second payment for an order already paid (F-100d) ──────────
CREATE OR REPLACE FUNCTION public.notify_admin_tallaby_pay_paid_twice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'tallaby_pay_refund_requested',
      jsonb_build_object(
        'source', 'paid_twice',
        'paymentId', new.id,
        'amount', new.amount::text,
        'currency', coalesce(new.currency, 'EGP'),
        'orderId', new.order_id,
        'orderNumber', o.order_number,
        'storeName', st.name
      ),
      st.seller_id,
      o.store_id,
      'tallaby_pay_refund_requested:payment:' || new.id::text
    FROM public.orders o
    LEFT JOIN public.stores st ON st.id = o.store_id
    WHERE o.id = new.order_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    -- The bell never blocks a payment.
    RAISE WARNING 'notify_admin_tallaby_pay_paid_twice: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_tallaby_pay_paid_twice() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS payments_notify_admin_tallaby_pay_paid_twice ON public.payments;
CREATE TRIGGER payments_notify_admin_tallaby_pay_paid_twice
  AFTER INSERT ON public.payments
  FOR EACH ROW
  WHEN (new.transaction_id LIKE 'tallaby_pay:%' AND new.payment_data->>'review' = 'paid_twice')
  EXECUTE FUNCTION public.notify_admin_tallaby_pay_paid_twice();
