-- Quantise every customer-facing price to a 5 EGP step, always rounding UP so a
-- rounded price never falls below the margin the seller priced the product at
-- (199 -> 200, 248 -> 250, 344 -> 345).
--
-- Applies to the live catalogue (products.price, product_variants.price) and to
-- the price snapshots on still-open carts, so a shopper is never charged a price
-- different from the one now rendered on the storefront.
--
-- Deliberately NOT touched:
--   * orders / order_items / payments / coupon_usage — historical records of
--     what was actually charged; they must stay exactly as they were.
--   * products.updated_at / product_variants.updated_at — the storefront orders
--     its trending and seasonal rails by updated_at, and a catalogue-wide bump
--     would reshuffle them for no reason.

-- Reads a price out of the jsonb, tolerating both `199` and `"199"`, and
-- yielding NULL for anything that is not a plain number (so a malformed row is
-- skipped rather than aborting the migration).
CREATE OR REPLACE FUNCTION pg_price_numeric(value jsonb)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN value IS NULL THEN NULL
    WHEN jsonb_typeof(value) = 'number' THEN (value #>> '{}')::numeric
    WHEN jsonb_typeof(value) = 'string'
     AND btrim(value #>> '{}') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN btrim(value #>> '{}')::numeric
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION pg_round_up_to_five(value numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN value IS NULL OR value <= 0 THEN value
    ELSE ceil(value / 5.0) * 5
  END;
$$;

-- products.price jsonb: { base, list, final, discountType, discountValue }
UPDATE products
SET price = price
  || jsonb_strip_nulls(
       jsonb_build_object(
         'base',  to_jsonb(pg_round_up_to_five(pg_price_numeric(price -> 'base'))),
         'list',  to_jsonb(pg_round_up_to_five(pg_price_numeric(price -> 'list'))),
         'final', to_jsonb(pg_round_up_to_five(pg_price_numeric(price -> 'final')))
       )
     )
WHERE jsonb_typeof(price) = 'object'
  AND (
       pg_price_numeric(price -> 'base')
         IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price -> 'base'))
    OR pg_price_numeric(price -> 'list')
         IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price -> 'list'))
    OR pg_price_numeric(price -> 'final')
         IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price -> 'final'))
  );

-- Legacy rows that stored a bare number / numeric string instead of the object.
UPDATE products
SET price = to_jsonb(pg_round_up_to_five(pg_price_numeric(price)))
WHERE jsonb_typeof(price) IN ('number', 'string')
  AND pg_price_numeric(price)
      IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price));

-- product_variants.price jsonb, same shape as products.price.
UPDATE product_variants
SET price = price
  || jsonb_strip_nulls(
       jsonb_build_object(
         'base',  to_jsonb(pg_round_up_to_five(pg_price_numeric(price -> 'base'))),
         'list',  to_jsonb(pg_round_up_to_five(pg_price_numeric(price -> 'list'))),
         'final', to_jsonb(pg_round_up_to_five(pg_price_numeric(price -> 'final')))
       )
     )
WHERE jsonb_typeof(price) = 'object'
  AND (
       pg_price_numeric(price -> 'base')
         IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price -> 'base'))
    OR pg_price_numeric(price -> 'list')
         IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price -> 'list'))
    OR pg_price_numeric(price -> 'final')
         IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price -> 'final'))
  );

UPDATE product_variants
SET price = to_jsonb(pg_round_up_to_five(pg_price_numeric(price)))
WHERE jsonb_typeof(price) IN ('number', 'string')
  AND pg_price_numeric(price)
      IS DISTINCT FROM pg_round_up_to_five(pg_price_numeric(price));

-- Variant price snapshot carried on open cart lines (cart_items.variant jsonb).
UPDATE cart_items ci
SET variant = ci.variant
  || jsonb_build_object(
       'price',
       (ci.variant -> 'price')
         || jsonb_build_object(
              'final',
              to_jsonb(
                pg_round_up_to_five(
                  pg_price_numeric(ci.variant -> 'price' -> 'final')
                )
              )
            )
     ),
    updated_at = now()
FROM carts c
WHERE c.id = ci.cart_id
  AND c.status = 'active'
  AND jsonb_typeof(ci.variant -> 'price') = 'object'
  AND pg_price_numeric(ci.variant -> 'price' -> 'final')
      IS DISTINCT FROM pg_round_up_to_five(
        pg_price_numeric(ci.variant -> 'price' -> 'final')
      );

-- cart_items.price is the numeric snapshot every checkout total is built from.
UPDATE cart_items ci
SET price = pg_round_up_to_five(ci.price),
    updated_at = now()
FROM carts c
WHERE c.id = ci.cart_id
  AND c.status = 'active'
  AND ci.price IS DISTINCT FROM pg_round_up_to_five(ci.price);

DROP FUNCTION IF EXISTS pg_round_up_to_five(numeric);
DROP FUNCTION IF EXISTS pg_price_numeric(jsonb);
