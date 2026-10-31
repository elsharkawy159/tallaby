-- 0134: deleting a user from Supabase Auth removes everything that user owns.
--
-- Before this, public.users had no foreign key to auth.users, so deleting an auth
-- user left the users, sellers, stores, products and orders rows behind. Several
-- child foreign keys were also NO ACTION/RESTRICT, so deleting an order, product or
-- seller by hand failed partway (for example on wallet_transactions.order_id).
--
-- Rules used here:
--   * Rows the deleted user owns are removed (ON DELETE CASCADE).
--   * Rows that belong to someone else but point at the deleted user (an admin who
--     reviewed something, a rider, the customer of another seller's ledger entry,
--     a referred user) are kept and the pointer is cleared (ON DELETE SET NULL).
--   * Another seller's store-wallet ledger entries are never deleted: when an order
--     is deleted, wallet_transactions.order_id is set to NULL and the balance stays.
--   * users.referred_by was CASCADE, which deleted every user the deleted user had
--     referred. It is now SET NULL.
--
-- Idempotent: every foreign key is dropped (IF EXISTS) and re-added with the same
-- name. users_id_auth_users_fk is added NOT VALID, so existing orphan rows
-- (public.users with no auth.users row) are not checked or deleted by this
-- migration; new deletes cascade normally.

CREATE OR REPLACE FUNCTION pg_temp.refk(
  p_child text, p_name text, p_col text, p_parent text, p_action text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', p_child, p_name);
  EXECUTE format(
    'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s (id) ON DELETE %s',
    p_child, p_name, p_col, p_parent, p_action
  );
END $$;

-- 1. public.users follows auth.users.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_id_auth_users_fk') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_auth_users_fk FOREIGN KEY (id)
      REFERENCES auth.users (id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

-- 2. A deleted user's referrals stay; only the pointer is cleared.
SELECT pg_temp.refk('public.users', 'users_referred_by_fkey', 'referred_by', 'public.users', 'SET NULL');

-- 3. Owned rows: removed with their parent.
SELECT pg_temp.refk('public.return_items', 'return_items_order_item_id_order_items_id_fk', 'order_item_id', 'public.order_items', 'CASCADE');
SELECT pg_temp.refk('public.seller_payout_items', 'seller_payout_items_order_item_id_order_items_id_fk', 'order_item_id', 'public.order_items', 'CASCADE');
SELECT pg_temp.refk('public.shipment_items', 'shipment_items_order_item_id_order_items_id_fk', 'order_item_id', 'public.order_items', 'CASCADE');
SELECT pg_temp.refk('public.reviews', 'reviews_order_item_id_order_items_id_fk', 'order_item_id', 'public.order_items', 'CASCADE');
SELECT pg_temp.refk('public.affiliate_commissions', 'affiliate_commissions_order_id_orders_id_fk', 'order_id', 'public.orders', 'CASCADE');
SELECT pg_temp.refk('public.coupon_usage', 'coupon_usage_order_id_orders_id_fk', 'order_id', 'public.orders', 'CASCADE');
SELECT pg_temp.refk('public.refunds', 'refunds_order_id_orders_id_fk', 'order_id', 'public.orders', 'CASCADE');
SELECT pg_temp.refk('public.returns', 'returns_order_id_orders_id_fk', 'order_id', 'public.orders', 'CASCADE');
SELECT pg_temp.refk('public.seller_payout_items', 'seller_payout_items_order_id_orders_id_fk', 'order_id', 'public.orders', 'CASCADE');
SELECT pg_temp.refk('public.cart_items', 'cart_items_product_id_products_id_fk', 'product_id', 'public.products', 'CASCADE');
SELECT pg_temp.refk('public.order_items', 'order_items_product_id_products_id_fk', 'product_id', 'public.products', 'CASCADE');
SELECT pg_temp.refk('public.reviews', 'reviews_product_id_products_id_fk', 'product_id', 'public.products', 'CASCADE');
SELECT pg_temp.refk('public.referral_commissions', 'referral_commissions_top_up_id_fkey', 'top_up_id', 'public.seller_wallet_top_ups', 'CASCADE');
SELECT pg_temp.refk('public.referral_commissions', 'referral_commissions_referrer_seller_id_fkey', 'referrer_seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.referral_commissions', 'referral_commissions_referred_seller_id_fkey', 'referred_seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.referral_payouts', 'referral_payouts_referrer_seller_id_fkey', 'referrer_seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.coupons', 'coupons_seller_id_sellers_id_fk', 'seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.affiliates', 'affiliates_coupon_id_coupons_id_fk', 'coupon_id', 'public.coupons', 'CASCADE');
SELECT pg_temp.refk('public.affiliate_commissions', 'affiliate_commissions_coupon_id_coupons_id_fk', 'coupon_id', 'public.coupons', 'CASCADE');
SELECT pg_temp.refk('public.product_answers', 'product_answers_seller_id_fkey', 'seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.review_comments', 'review_comments_seller_id_sellers_id_fk', 'seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.reviews', 'reviews_seller_id_sellers_id_fk', 'seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.seller_welcome_gifts', 'seller_welcome_gifts_seller_id_fkey', 'seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.shipments', 'shipments_seller_id_sellers_id_fk', 'seller_id', 'public.sellers', 'CASCADE');
SELECT pg_temp.refk('public.returns', 'returns_user_id_users_id_fk', 'user_id', 'public.users', 'CASCADE');
SELECT pg_temp.refk('public.review_comments', 'review_comments_user_id_users_id_fk', 'user_id', 'public.users', 'CASCADE');
SELECT pg_temp.refk('public.search_logs', 'search_logs_user_id_users_id_fk', 'user_id', 'public.users', 'CASCADE');

-- 4. Someone else's rows: kept, pointer cleared.
SELECT pg_temp.refk('public.wallet_transactions', 'wallet_transactions_order_id_orders_id_fk', 'order_id', 'public.orders', 'SET NULL');
SELECT pg_temp.refk('public.affiliate_commissions', 'affiliate_commissions_parent_commission_id_fk', 'parent_commission_id', 'public.affiliate_commissions', 'SET NULL');
SELECT pg_temp.refk('public.orders', 'orders_cart_id_carts_id_fk', 'cart_id', 'public.carts', 'SET NULL');
SELECT pg_temp.refk('public.orders', 'orders_shipping_address_id_user_addresses_id_fk', 'shipping_address_id', 'public.user_addresses', 'SET NULL');
SELECT pg_temp.refk('public.orders', 'orders_billing_address_id_user_addresses_id_fk', 'billing_address_id', 'public.user_addresses', 'SET NULL');
SELECT pg_temp.refk('public.payment_methods', 'payment_methods_billing_address_id_user_addresses_id_fk', 'billing_address_id', 'public.user_addresses', 'SET NULL');
SELECT pg_temp.refk('public.payments', 'payments_payment_method_id_payment_methods_id_fk', 'payment_method_id', 'public.payment_methods', 'SET NULL');
SELECT pg_temp.refk('public.refunds', 'refunds_return_id_returns_id_fk', 'return_id', 'public.returns', 'SET NULL');
SELECT pg_temp.refk('public.search_logs', 'search_logs_clicked_product_id_products_id_fk', 'clicked_product_id', 'public.products', 'SET NULL');
SELECT pg_temp.refk('public.seller_welcome_gifts', 'seller_welcome_gifts_wallet_entry_id_fkey', 'wallet_entry_id', 'public.wallet_transactions', 'SET NULL');
SELECT pg_temp.refk('public.seller_welcome_gifts', 'seller_welcome_gifts_expiry_entry_id_fkey', 'expiry_entry_id', 'public.wallet_transactions', 'SET NULL');
SELECT pg_temp.refk('public.deliveries', 'deliveries_driver_id_users_id_fk', 'driver_id', 'public.users', 'SET NULL');
SELECT pg_temp.refk('public.refunds', 'refunds_refunded_by_users_id_fk', 'refunded_by', 'public.users', 'SET NULL');
SELECT pg_temp.refk('public.seller_documents', 'seller_documents_reviewed_by_users_id_fk', 'reviewed_by', 'public.users', 'SET NULL');
SELECT pg_temp.refk('public.shipment_batch_items', 'shipment_batch_items_rider_id_users_id_fk', 'rider_id', 'public.users', 'SET NULL');
SELECT pg_temp.refk('public.shipment_batches', 'shipment_batches_created_by_users_id_fk', 'created_by', 'public.users', 'SET NULL');
SELECT pg_temp.refk('public.shipments', 'shipments_rider_id_users_id_fk', 'rider_id', 'public.users', 'SET NULL');

-- 5. Ledger guards.
-- Store-wallet ledger: still append-only, but an order's deletion may clear
-- order_id (SET NULL above), and a deleted seller's rows may go (unchanged).
CREATE OR REPLACE FUNCTION public.wallet_transactions_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'store_id' - 'created_by' - 'order_id') = (to_jsonb(OLD) - 'store_id' - 'created_by' - 'order_id')
       AND (NEW.store_id IS NULL OR NEW.store_id IS NOT DISTINCT FROM OLD.store_id)
       AND (NEW.created_by IS NULL OR NEW.created_by IS NOT DISTINCT FROM OLD.created_by)
       AND (NEW.order_id IS NULL OR NEW.order_id IS NOT DISTINCT FROM OLD.order_id) THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id) THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'wallet_transactions is append-only; post a compensating entry instead of %', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

-- Customer wallet ledger: still append-only, except when its user is deleted.
CREATE OR REPLACE FUNCTION public.user_wallet_transactions_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = OLD.user_id) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'user_wallet_transactions is append-only; post a compensating transaction instead of %', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;
