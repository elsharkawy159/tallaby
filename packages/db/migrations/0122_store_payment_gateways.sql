-- 0122_store_payment_gateways.sql: the seller's own payment gateway per store
-- (ROADMAP.md F-39, owner 2026-10-30).
--
-- store_integrations accepts providers 'paymob' and 'kashier'. The seller's
-- gateway keys live in credentials_encrypted (AES-256-GCM, app-side, bound to
-- the store id and provider); config holds only public details (mode, key
-- hint, and when the first signed webhook arrived).
--
-- Storefront card payments through these gateways go straight to the seller,
-- so the order carries metadata.paymentCollector = 'seller' and delivery posts
-- the EGP 5 fee only (PLAN.md §13.4). No other table changes.
--
-- Additive and idempotent: code that does not know these providers keeps working.

ALTER TABLE store_integrations DROP CONSTRAINT IF EXISTS store_integrations_provider_check;
ALTER TABLE store_integrations ADD CONSTRAINT store_integrations_provider_check CHECK (provider IN (
  'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
  'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta',
  'paymob', 'kashier'
));
