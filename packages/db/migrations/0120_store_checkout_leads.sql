-- 0120: Missed orders (ROADMAP.md F-03,
-- docs/superpowers/specs/2026-10-29-missed-orders-design.md).
--
-- When a visitor on a store website picks or adds a shipping address at
-- checkout, the server saves a lead: the store, the checkout user and cart,
-- name, phone (normalised 01XXXXXXXXX), the real email of a signed-in
-- customer, governorate, city, a snapshot of the cart and its totals. The
-- seller sees open leads under Orders › Not completed and follows up on
-- WhatsApp or by phone. One open lead per store and phone.
--
-- When an order is placed on that store from the same cart, the same user or
-- the same phone, the AFTER INSERT trigger below marks the lead converted, so
-- no checkout code changes. Leads are deleted after 30 days by a daily job.
--
-- Server-only (RLS on, no policies). Additive and idempotent.

CREATE TABLE IF NOT EXISTS public.store_checkout_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  cart_id uuid REFERENCES public.carts(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  governorate text,
  city text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2),
  total numeric(10,2),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  converted_at timestamptz,
  contacted_at timestamptz,
  contacted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_checkout_leads_phone_format CHECK (phone ~ '^01[0125][0-9]{8}$'),
  CONSTRAINT store_checkout_leads_items_array CHECK (jsonb_typeof(items) = 'array'),
  CONSTRAINT store_checkout_leads_amounts CHECK (
    subtotal >= 0 AND (shipping IS NULL OR shipping >= 0) AND (total IS NULL OR total >= 0)
  )
);

-- One open lead per store and phone (a returning visitor updates it).
CREATE UNIQUE INDEX IF NOT EXISTS store_checkout_leads_open_phone_key
  ON public.store_checkout_leads (store_id, phone) WHERE order_id IS NULL;
-- The seller's list (open leads, newest first) and the conversion trigger.
CREATE INDEX IF NOT EXISTS store_checkout_leads_seller_open_idx
  ON public.store_checkout_leads (seller_id, updated_at DESC) WHERE order_id IS NULL;
CREATE INDEX IF NOT EXISTS store_checkout_leads_store_open_idx
  ON public.store_checkout_leads (store_id) WHERE order_id IS NULL;
-- The 30-day cleanup.
CREATE INDEX IF NOT EXISTS store_checkout_leads_created_idx
  ON public.store_checkout_leads (created_at);

ALTER TABLE public.store_checkout_leads ENABLE ROW LEVEL SECURITY;

-- An order on a store converts that store's open lead for the same cart,
-- user or phone. SECURITY DEFINER: the lead table has no policies, and the
-- order may be inserted by any role the app uses.
CREATE OR REPLACE FUNCTION public.convert_store_checkout_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_phone text;
BEGIN
  IF NEW.store_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.shipping_address_id IS NOT NULL THEN
    SELECT regexp_replace(regexp_replace(regexp_replace(coalesce(a.phone, ''), '[^0-9+]', '', 'g'), '^\+20', '0'), '^0020', '0')
      INTO order_phone
      FROM user_addresses a
     WHERE a.id = NEW.shipping_address_id;
  END IF;

  UPDATE store_checkout_leads l
     SET order_id = NEW.id, converted_at = now(), updated_at = now()
   WHERE l.store_id = NEW.store_id
     AND l.order_id IS NULL
     AND (
       (NEW.cart_id IS NOT NULL AND l.cart_id = NEW.cart_id)
       OR (NEW.user_id IS NOT NULL AND l.user_id = NEW.user_id)
       OR (order_phone IS NOT NULL AND l.phone = order_phone)
     );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A lead must never block an order.
  RAISE WARNING 'convert_store_checkout_lead failed for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_store_checkout_lead() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_convert_store_checkout_lead ON public.orders;
CREATE TRIGGER orders_convert_store_checkout_lead
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.convert_store_checkout_lead();

-- Rollback:
--   DROP TRIGGER orders_convert_store_checkout_lead ON orders;
--   DROP FUNCTION convert_store_checkout_lead();
--   DROP TABLE store_checkout_leads;
