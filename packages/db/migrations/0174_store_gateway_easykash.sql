-- 0174_store_gateway_easykash.sql: the seller's own EasyKash account as a
-- store payment gateway (ROADMAP.md F-98, docs/easykash.md; owner 2026-11-18).
--
-- store_integrations accepts provider 'easykash'. Like paymob / kashier
-- (0130): the seller's API key and HMAC secret live in credentials_encrypted
-- (AES-256-GCM, app-side, bound to the store id and provider); config holds
-- only public details (mode 'live', key hint, when the first signed callback
-- arrived). Storefront payments through it go straight to the seller's
-- EasyKash account (metadata.paymentCollector = 'seller'). The latest attempt's
-- reference lives in orders.metadata, so no new table or column.
--
-- The list is the live definition (0056, 'bosta' from 0106, 'paymob',
-- 'kashier' and 'wassalha' from 0130) plus 'easykash'. A guard aborts before
-- any change if a row would fail the new check.
--
-- Additive and idempotent: code that does not know 'easykash' keeps working.
-- Apply on staging, then production with owner approval, BEFORE deploying the
-- code that connects EasyKash (it writes provider = 'easykash').

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM store_integrations
    WHERE provider NOT IN (
      'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
      'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta',
      'paymob', 'kashier', 'wassalha', 'easykash'
    )
  ) THEN
    RAISE EXCEPTION '0174: store_integrations has a provider outside the new check; nothing changed';
  END IF;
END $$;

ALTER TABLE store_integrations DROP CONSTRAINT IF EXISTS store_integrations_provider_check;
ALTER TABLE store_integrations ADD CONSTRAINT store_integrations_provider_check CHECK (provider IN (
  'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
  'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta',
  'paymob', 'kashier', 'wassalha', 'easykash'
));
