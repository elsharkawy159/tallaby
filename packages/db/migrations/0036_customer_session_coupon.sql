-- Pending coupon captured from `?coupon=` lives on the customer session,
-- not a dedicated cookie.
CREATE TABLE IF NOT EXISTS customer_sessions (
  id text PRIMARY KEY,
  coupon_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
