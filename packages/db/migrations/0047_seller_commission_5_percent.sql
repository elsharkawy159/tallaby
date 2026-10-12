-- Platform commission drops from 10% to 5%. Sellers still on the old default
-- move to the new one; any custom rate an admin set is left untouched.
--
-- Idempotent. Server-side (Drizzle) access only.

ALTER TABLE sellers
  ALTER COLUMN commission_rate SET DEFAULT '5';

UPDATE sellers
SET commission_rate = 5
WHERE commission_rate = 10;
