-- Behaviour checks for migrations 0050–0057 (PLAN.md P1-02 / P1-07).
-- Runs inside one transaction and ROLLS BACK: safe on staging, changes nothing.
--   psql "$STAGING_DB" -X -v ON_ERROR_STOP=1 -f packages/db/sql-tests/stores_invariants.sql
-- Every check RAISEs on failure; the last line prints 'ALL STORE INVARIANTS PASSED'.

BEGIN;

DO $$
DECLARE
  u_a uuid;
  u_b uuid;
  store_a uuid;
  store_b uuid;
  extra_a uuid;
  prod_b uuid;
  rev_a uuid;
  rev_b uuid;
  col_a uuid;
  v text;
  failed boolean;
BEGIN
  -- Two users without a seller row become test sellers A and B.
  SELECT id INTO u_a FROM users u WHERE NOT EXISTS (SELECT 1 FROM sellers s WHERE s.id = u.id) ORDER BY created_at LIMIT 1;
  SELECT id INTO u_b FROM users u WHERE NOT EXISTS (SELECT 1 FROM sellers s WHERE s.id = u.id) AND id <> u_a ORDER BY created_at LIMIT 1;
  IF u_a IS NULL OR u_b IS NULL THEN RAISE EXCEPTION 'need two users without a seller row'; END IF;

  INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email)
  VALUES (u_a, 'Inv Test A', 'Inv Test A', 'inv-test-a-zz', 'individual', '{"country":"EG"}', 'a@example.com'),
         (u_b, 'Inv Test B', 'Inv Test B', 'inv-test-b-zz', 'individual', '{"country":"EG"}', 'b@example.com');

  -- 1. A new seller gets exactly one primary store with its subdomain.
  SELECT id, subdomain INTO store_a, v FROM stores WHERE seller_id = u_a AND is_primary;
  IF store_a IS NULL THEN RAISE EXCEPTION '1: no primary store created for new seller'; END IF;
  IF v <> (SELECT subdomain FROM sellers WHERE id = u_a) THEN RAISE EXCEPTION '1: primary store subdomain % <> seller subdomain', v; END IF;
  SELECT id INTO store_b FROM stores WHERE seller_id = u_b AND is_primary;
  IF (SELECT plan FROM sellers WHERE id = u_a) <> 'free' THEN RAISE EXCEPTION '1: plan default is not free'; END IF;

  -- 2. Legacy write: sellers.subdomain → primary store.
  UPDATE sellers SET subdomain = 'inv-renamed-a' WHERE id = u_a;
  IF (SELECT subdomain FROM stores WHERE id = store_a) <> 'inv-renamed-a' THEN RAISE EXCEPTION '2: seller→store subdomain sync failed'; END IF;

  -- 3. New write path: primary store subdomain → sellers.subdomain.
  UPDATE stores SET subdomain = 'inv-renamed-a2' WHERE id = store_a;
  IF (SELECT subdomain FROM sellers WHERE id = u_a) <> 'inv-renamed-a2' THEN RAISE EXCEPTION '3: store→seller subdomain sync failed'; END IF;

  -- 3b. Storefront profile sync for the primary store, both ways (until P5-00).
  UPDATE sellers SET display_name = 'Legacy Name', return_policy = 'Legacy returns', support_phone = '0100' WHERE id = u_a;
  IF (SELECT name FROM stores WHERE id = store_a) <> 'Legacy Name'
     OR (SELECT policies->>'return' FROM stores WHERE id = store_a) <> 'Legacy returns'
     OR (SELECT contact->>'phone' FROM stores WHERE id = store_a) <> '0100' THEN
    RAISE EXCEPTION '3b: seller→store profile sync failed';
  END IF;
  UPDATE stores SET name = 'New Name', description = 'New desc',
         policies = policies || '{"shipping":"Ships fast"}', contact = '{"phone":"0111"}'
  WHERE id = store_a;
  IF (SELECT display_name FROM sellers WHERE id = u_a) <> 'New Name'
     OR (SELECT store_description FROM sellers WHERE id = u_a) <> 'New desc'
     OR (SELECT shipping_policy FROM sellers WHERE id = u_a) <> 'Ships fast'
     OR (SELECT support_phone FROM sellers WHERE id = u_a) <> '0111'
     OR (SELECT support_email FROM sellers WHERE id = u_a) <> '' THEN
    RAISE EXCEPTION '3b: store→seller profile sync failed';
  END IF;
  -- The round trip settled: the store still has exactly what was written.
  IF (SELECT contact FROM stores WHERE id = store_a) <> '{"phone":"0111"}'::jsonb THEN
    RAISE EXCEPTION '3b: profile sync did not settle (contact = %)', (SELECT contact FROM stores WHERE id = store_a);
  END IF;

  -- 4. A non-primary store does not touch sellers.subdomain.
  INSERT INTO stores (seller_id, name, subdomain) VALUES (u_a, 'A second', 'inv-second-a') RETURNING id INTO extra_a;
  UPDATE stores SET subdomain = 'inv-second-a2' WHERE id = extra_a;
  IF (SELECT subdomain FROM sellers WHERE id = u_a) <> 'inv-renamed-a2' THEN RAISE EXCEPTION '4: non-primary store changed sellers.subdomain'; END IF;

  -- 5. A second primary store is impossible.
  failed := false;
  BEGIN
    INSERT INTO stores (seller_id, name, subdomain, is_primary) VALUES (u_a, 'dup primary', 'inv-dup-primary', true);
  EXCEPTION WHEN unique_violation THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION '5: second primary store was accepted'; END IF;

  -- 6. Subdomain rules: reserved and duplicate are rejected.
  failed := false;
  BEGIN INSERT INTO stores (seller_id, name, subdomain) VALUES (u_a, 'x', 'admin');
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '6: reserved subdomain accepted'; END IF;
  failed := false;
  BEGIN INSERT INTO stores (seller_id, name, subdomain) VALUES (u_b, 'x', 'inv-second-a2');
  EXCEPTION WHEN unique_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '6: duplicate subdomain accepted'; END IF;

  -- 7. generate_seller_subdomain avoids subdomains taken by any store.
  IF generate_seller_subdomain('inv second a2', u_b) = 'inv-second-a2' THEN
    RAISE EXCEPTION '7: generated subdomain collides with another seller''s store';
  END IF;

  -- 8. store_id is filled for legacy redirect and cart inserts.
  INSERT INTO seller_subdomain_redirects (subdomain, seller_id) VALUES ('inv-old-a', u_a);
  IF (SELECT store_id FROM seller_subdomain_redirects WHERE subdomain = 'inv-old-a') IS DISTINCT FROM store_a THEN
    RAISE EXCEPTION '8: redirect store_id not filled';
  END IF;
  INSERT INTO carts (user_id, store_seller_id) VALUES (u_b, u_a);
  IF (SELECT store_id FROM carts WHERE user_id = u_b AND store_seller_id = u_a) IS DISTINCT FROM store_a THEN
    RAISE EXCEPTION '8: storefront cart store_id not filled';
  END IF;
  INSERT INTO carts (user_id) VALUES (u_b);
  IF EXISTS (SELECT 1 FROM carts WHERE user_id = u_b AND store_seller_id IS NULL AND store_id IS NOT NULL) THEN
    RAISE EXCEPTION '8: marketplace cart got a store_id';
  END IF;

  -- 9. store_products only accepts the store owner's products.
  SELECT id INTO prod_b FROM products WHERE seller_id <> u_a LIMIT 1;
  failed := false;
  BEGIN INSERT INTO store_products (store_id, product_id) VALUES (store_a, prod_b);
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '9: cross-seller store_products row accepted'; END IF;

  -- 10. Revisions: append-only, same-store pointer, cascade on store delete.
  INSERT INTO store_site_revisions (store_id, revision_number, schema_version, template_key, snapshot, published_by)
  VALUES (store_a, 1, 1, 'tallaby-classic', '{}', u_a) RETURNING id INTO rev_a;
  INSERT INTO store_site_revisions (store_id, revision_number, schema_version, template_key, snapshot)
  VALUES (store_b, 1, 1, 'tallaby-classic', '{}') RETURNING id INTO rev_b;
  failed := false;
  BEGIN UPDATE store_site_revisions SET snapshot = '{"x":1}' WHERE id = rev_a;
  EXCEPTION WHEN restrict_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '10: revision UPDATE accepted'; END IF;
  failed := false;
  BEGIN DELETE FROM store_site_revisions WHERE id = rev_a;
  EXCEPTION WHEN restrict_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '10: revision DELETE accepted'; END IF;
  -- Clearing published_by alone is allowed (users ON DELETE SET NULL); with any other change it is not.
  failed := false;
  BEGIN UPDATE store_site_revisions SET published_by = NULL, snapshot = '{"x":2}' WHERE id = rev_a;
  EXCEPTION WHEN restrict_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '10: revision UPDATE hidden behind published_by = NULL accepted'; END IF;
  UPDATE store_site_revisions SET published_by = NULL WHERE id = rev_a;
  IF (SELECT published_by FROM store_site_revisions WHERE id = rev_a) IS NOT NULL THEN
    RAISE EXCEPTION '10: clearing published_by was blocked';
  END IF;
  failed := false;
  BEGIN UPDATE stores SET published_revision_id = rev_b WHERE id = store_a;
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '10: another store''s revision accepted as published'; END IF;
  UPDATE stores SET published_revision_id = rev_a WHERE id = store_a;
  INSERT INTO store_site_revisions (store_id, revision_number, schema_version, template_key, snapshot)
  VALUES (extra_a, 1, 1, 'tallaby-classic', '{}');
  DELETE FROM stores WHERE id = extra_a;   -- cascade must be allowed
  IF EXISTS (SELECT 1 FROM store_site_revisions WHERE store_id = extra_a) THEN RAISE EXCEPTION '10: cascade left revisions'; END IF;

  -- 11. CMS items must be in their collection's store; form submissions in their form's store.
  INSERT INTO cms_collections (store_id, name, slug) VALUES (store_a, 'Blog', 'blog') RETURNING id INTO col_a;
  failed := false;
  BEGIN INSERT INTO cms_items (collection_id, store_id, slug) VALUES (col_a, store_b, 'p1');
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '11: cms item in a foreign store accepted'; END IF;

  -- 12. Integrations: seller_id must own the store.
  failed := false;
  BEGIN INSERT INTO store_integrations (store_id, seller_id, provider) VALUES (store_a, u_b, 'meta_pixel');
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '12: integration with a foreign seller accepted'; END IF;

  -- 13. Media: path and store must belong to the seller.
  failed := false;
  BEGIN INSERT INTO media_assets (seller_id, storage_path, filename, mime_type, bytes)
        VALUES (u_a, u_b::text || '/shared/x.png', 'x.png', 'image/png', 1);
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '13: media path outside the seller folder accepted'; END IF;
  failed := false;
  BEGIN INSERT INTO media_assets (seller_id, store_id, storage_path, filename, mime_type, bytes)
        VALUES (u_a, store_b, u_a::text || '/shared/x.png', 'x.png', 'image/png', 1);
  EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION '13: media in a foreign store accepted'; END IF;

  -- 14. Shipping zones: one enabled zone per governorate (deferred check).
  INSERT INTO store_shipping_zones (store_id, name, governorates, price) VALUES (store_a, '{"en":"Z1"}', ARRAY['cairo','giza'], 50);
  INSERT INTO store_shipping_zones (store_id, name, governorates, price, enabled) VALUES (store_a, '{"en":"Z2"}', ARRAY['giza'], 60, false);
  INSERT INTO store_shipping_zones (store_id, name, governorates, price) VALUES (store_b, '{"en":"Other store"}', ARRAY['giza'], 60);
  SET CONSTRAINTS store_shipping_zones_no_overlap IMMEDIATE;  -- disabled zone + other store: fine
  SET CONSTRAINTS store_shipping_zones_no_overlap DEFERRED;
  failed := false;
  BEGIN
    INSERT INTO store_shipping_zones (store_id, name, governorates, price) VALUES (store_a, '{"en":"Z3"}', ARRAY['giza'], 70);
    SET CONSTRAINTS store_shipping_zones_no_overlap IMMEDIATE;
  EXCEPTION WHEN exclusion_violation THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION '14: overlapping enabled zones accepted'; END IF;

  RAISE NOTICE 'ALL STORE INVARIANTS PASSED';
END $$;

ROLLBACK;
