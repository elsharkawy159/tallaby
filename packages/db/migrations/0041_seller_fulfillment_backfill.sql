-- Backfill for 0040 + seller identity repair. Run AFTER 0040 and BEFORE
-- deploying the dashboard's seller-row access gate. Idempotent.
--
-- 1. Existing sellers get a fulfillment profile + five service rows describing
--    how they actually operate today, all `active` with requested = active:
--      storage / packaging / customer_service / returns -> seller
--      delivery -> tallaby + delivery_standard, flagged legacy. Checkout already
--      bills Tallaby's governorate rates and the shipping app auto-assigns
--      Tallaby riders; sellers who have their own riders can additionally
--      deliver their seller_fulfilled orders (seller_riders_allowed).
--    Nothing here changes order behavior - it only records it.
--
-- 2. Onboarding never set users.role = 'seller' nor user_metadata.is_seller,
--    so every seller created through it is missing both. Repair them.

INSERT INTO seller_fulfillment_profiles (seller_id, model, review_status, admin_notes, submitted_at)
SELECT s.id, 'seller_managed', 'configured',
       'Migrated from pre-fulfillment onboarding (0041). Reflects existing behavior.',
       s.created_at
FROM sellers s
ON CONFLICT (seller_id) DO NOTHING;

INSERT INTO seller_fulfillment_services
  (seller_id, service_type, requested_provider, requested_plan_id, requested_config,
   active_provider, active_plan_id, active_config, status, requested_at, activated_at, notes)
SELECT s.id, svc.service_type, 'seller', NULL, '{}'::jsonb,
       'seller', NULL, '{}'::jsonb, 'active', s.created_at, now(),
       'Migrated baseline (0041)'
FROM sellers s
CROSS JOIN (VALUES
  ('storage'::fulfillment_service_type),
  ('packaging'::fulfillment_service_type),
  ('customer_service'::fulfillment_service_type),
  ('returns'::fulfillment_service_type)
) AS svc (service_type)
ON CONFLICT (seller_id, service_type) DO NOTHING;

INSERT INTO seller_fulfillment_services
  (seller_id, service_type, requested_provider, requested_plan_id, requested_config,
   active_provider, active_plan_id, active_config, status, requested_at, activated_at, notes)
SELECT s.id, 'delivery', 'tallaby', p.id, cfg.config,
       'tallaby', p.id, cfg.config, 'active', s.created_at, now(),
       'Migrated baseline (0041)'
FROM sellers s
CROSS JOIN fulfillment_plans p
CROSS JOIN LATERAL (
  SELECT jsonb_build_object(
    'legacy', true,
    'sellerRidersAllowed', EXISTS (SELECT 1 FROM seller_riders r WHERE r.seller_id = s.id)
  ) AS config
) cfg
WHERE p.code = 'delivery_standard'
ON CONFLICT (seller_id, service_type) DO NOTHING;

UPDATE sellers
SET onboarding_complete = true
WHERE onboarding_complete IS DISTINCT FROM true;

-- Identity repair. Admin/support/marketing roles are left alone.
UPDATE users
SET role = 'seller', updated_at = now()
WHERE id IN (SELECT id FROM sellers)
  AND (role IS NULL OR role = 'customer');

-- Supabase-specific: user_metadata lives in auth.users.raw_user_meta_data.
-- The dashboard no longer depends on it (it reads the sellers row), but the
-- storefront middleware still uses it as a fast path.
UPDATE auth.users
SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"is_seller": true}'::jsonb
WHERE id IN (SELECT id FROM sellers)
  AND coalesce(raw_user_meta_data ->> 'is_seller', '') <> 'true';
