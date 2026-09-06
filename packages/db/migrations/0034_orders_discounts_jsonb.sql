-- Per-order discount breakdown for admin/audit (keep discount_amount as numeric total).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discounts jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Best-effort backfill for existing discounted orders.
-- 1) Percentage coupon + shipping waiver that equals discount_amount → two lines.
-- 2) Otherwise one legacy line inferred from coupon_code.
WITH candidates AS (
  SELECT
    o.id,
    o.subtotal::numeric AS subtotal,
    o.shipping_cost::numeric AS shipping_cost,
    o.discount_amount::numeric AS discount_amount,
    o.coupon_code,
    c.id AS coupon_id,
    c.discount_type,
    c.discount_value::numeric AS discount_value
  FROM orders o
  LEFT JOIN coupons c
    ON o.coupon_code IS NOT NULL
   AND btrim(o.coupon_code) <> ''
   AND upper(c.code) = upper(o.coupon_code)
  WHERE o.discount_amount IS NOT NULL
    AND o.discount_amount::numeric > 0
    AND (o.discounts IS NULL OR o.discounts = '[]'::jsonb)
),
split AS (
  SELECT
    id,
    coupon_code,
    coupon_id,
    discount_value,
    shipping_cost,
    round(subtotal * discount_value / 100, 2) AS merchandise_discount,
    shipping_cost AS shipping_discount
  FROM candidates
  WHERE discount_type = 'percentage'
    AND shipping_cost > 0
    AND round(subtotal * discount_value / 100, 2) > 0
    AND round(
      discount_amount - round(subtotal * discount_value / 100, 2),
      2
    ) = shipping_cost
)
UPDATE orders o
SET discounts = jsonb_build_array(
  jsonb_build_object(
    'type', 'coupon',
    'label', upper(s.coupon_code) || ' (' || trim(to_char(s.discount_value, 'FM999990')) || '%)',
    'amount', to_char(s.merchandise_discount, 'FM999999990.00'),
    'code', upper(s.coupon_code),
    'couponId', s.coupon_id::text,
    'couponDiscountType', 'percentage'
  ),
  jsonb_build_object(
    'type', 'threshold_free_shipping',
    'label', 'Free delivery (orders ≥ 500 EGP)',
    'amount', to_char(s.shipping_discount, 'FM999999990.00')
  )
)
FROM split s
WHERE o.id = s.id;

UPDATE orders
SET discounts = jsonb_build_array(
  jsonb_build_object(
    'type', CASE
      WHEN coupon_code IS NOT NULL AND btrim(coupon_code) <> '' THEN 'coupon'
      ELSE 'threshold_free_shipping'
    END,
    'label', CASE
      WHEN coupon_code IS NOT NULL AND btrim(coupon_code) <> '' THEN coupon_code
      ELSE 'Free delivery'
    END,
    'amount', to_char(discount_amount::numeric, 'FM999999990.00'),
    'code', CASE
      WHEN coupon_code IS NOT NULL AND btrim(coupon_code) <> '' THEN coupon_code
      ELSE NULL
    END
  )
)
WHERE discount_amount IS NOT NULL
  AND discount_amount::numeric > 0
  AND (discounts IS NULL OR discounts = '[]'::jsonb);
