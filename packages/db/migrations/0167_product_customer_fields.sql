-- 0167: Customer requirements on a product (مطلوب من العميل), ROADMAP.md F-91
-- (owner request and approval 2026-11-12, including the extra price per field).
--
-- A seller can ask the customer for something on a product (a name to print,
-- a photo for a T-shirt, a choice such as "Gold print +30"). Up to 10 fields,
-- types text | image | choice, defined and validated by
-- packages/lib/src/products/customer-fields.lib.ts (zod); the database only
-- checks the JSON is an array.
--
--   products.customer_fields     jsonb  the field definitions (NULL = none).
--   cart_items.customer_inputs   jsonb  what the customer filled on that line
--                                       ({ key, extrasPiastres, lines[] });
--                                       cart_items.price already includes the
--                                       extras (worked out on the server).
--   order_items.customer_inputs  jsonb  the snapshot on the order: both labels,
--                                       the value, its extra and image storage
--                                       paths (never public links).
--
-- Customer photos go to the PRIVATE bucket `order-customer-uploads` (10 MB,
-- JPEG/PNG/WebP) with NO storage policies, like `order-payment-proofs` (0132):
-- the storefront signs one upload into `<store id|market>/<user id>/<uuid>.<ext>`
-- with the service role, add-to-cart checks the path, type and size, and the
-- dashboard shows them through short-lived signed URLs after checking the
-- seller owns the order's store. Uploads never attached to an order are deleted
-- after 7 days by the ecommerce cron /api/cron/customer-uploads.
--
-- Additive, but the product, cart and order queries select every column, so
-- apply it on staging, then production, BEFORE deploying the code that ships
-- with it. Idempotent. No money moves; the Tallaby fee is unchanged.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customer_fields jsonb;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS customer_inputs jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customer_inputs jsonb;

-- Every existing row is NULL, so NOT VALID + VALIDATE stays quick and keeps the lock short.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_customer_fields_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_customer_fields_check
      CHECK (customer_fields IS NULL OR jsonb_typeof(customer_fields) = 'array') NOT VALID;
    ALTER TABLE public.products VALIDATE CONSTRAINT products_customer_fields_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_customer_inputs_check') THEN
    ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_customer_inputs_check
      CHECK (customer_inputs IS NULL OR jsonb_typeof(customer_inputs) = 'object') NOT VALID;
    ALTER TABLE public.cart_items VALIDATE CONSTRAINT cart_items_customer_inputs_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_customer_inputs_check') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_customer_inputs_check
      CHECK (customer_inputs IS NULL OR jsonb_typeof(customer_inputs) = 'object') NOT VALID;
    ALTER TABLE public.order_items VALIDATE CONSTRAINT order_items_customer_inputs_check;
  END IF;
END $$;

COMMENT ON COLUMN public.products.customer_fields IS
  'Customer requirements (F-91): field definitions, validated by @workspace/lib customer-fields; NULL = none.';
COMMENT ON COLUMN public.cart_items.customer_inputs IS
  'Customer requirements (F-91): what the customer filled; price already includes the extras.';
COMMENT ON COLUMN public.order_items.customer_inputs IS
  'Customer requirements (F-91): snapshot of the filled fields (both labels, value, extra, image paths).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-customer-uploads', 'order-customer-uploads', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Rollback (before any data depends on it):
--   ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_customer_fields_check, DROP COLUMN IF EXISTS customer_fields;
--   ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_customer_inputs_check, DROP COLUMN IF EXISTS customer_inputs;
--   ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_customer_inputs_check, DROP COLUMN IF EXISTS customer_inputs;
--   DELETE FROM storage.buckets WHERE id = 'order-customer-uploads' (only when empty).
