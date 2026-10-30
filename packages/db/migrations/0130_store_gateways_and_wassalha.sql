-- 0130_store_gateways_and_wassalha.sql: the seller's own payment gateway and
-- the Wassalha (Egypt Post) shipping sheet per store (ROADMAP.md F-39, F-12c;
-- owner 2026-10-30).
--
-- store_integrations accepts providers 'paymob', 'kashier' and 'wassalha'.
-- - paymob / kashier: the seller's gateway keys live in credentials_encrypted
--   (AES-256-GCM, app-side, bound to the store id and provider); config holds
--   only public details (mode, key hint, when the first signed webhook
--   arrived). Storefront card payments through them go straight to the
--   seller, so those orders carry metadata.paymentCollector = 'seller' and
--   delivery posts the EGP 5 fee only (PLAN.md §13.4).
-- - wassalha: no API and no secret. config holds the seller's Wassalha
--   account details printed on every row of the exported upload sheet
--   (Post_Id, merchant, warehouse, sender, POD, package size, note).
--   Exported orders get a `shipments` row with carrier 'wassalha' (the column
--   is free text, so no other change).
--
-- Additive and idempotent: code that does not know these providers keeps working.

ALTER TABLE store_integrations DROP CONSTRAINT IF EXISTS store_integrations_provider_check;
ALTER TABLE store_integrations ADD CONSTRAINT store_integrations_provider_check CHECK (provider IN (
  'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
  'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta',
  'paymob', 'kashier', 'wassalha'
));
