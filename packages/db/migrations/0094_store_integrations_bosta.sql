-- 0094: Bosta shipping app per store (store_integrations.provider gains 'bosta').
-- Additive and idempotent: the provider CHECK is replaced with the same list plus 'bosta'.
-- The Bosta API key is stored only in credentials_encrypted (AES-256-GCM, app-side); config holds
-- public details (pickup location name, options, shipped count). Bosta deliveries are recorded on the
-- existing shipments row (carrier = 'bosta', tracking_number = Bosta tracking number).

ALTER TABLE store_integrations DROP CONSTRAINT IF EXISTS store_integrations_provider_check;
ALTER TABLE store_integrations ADD CONSTRAINT store_integrations_provider_check CHECK (provider IN (
  'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
  'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import',
  'bosta'
));
