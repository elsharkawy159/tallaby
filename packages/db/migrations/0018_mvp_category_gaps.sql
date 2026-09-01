-- Idempotent seed for MVP category gaps (Tallaby-native leaves).
-- Inserts only when no category with the same name or slug exists.

DO $$
DECLARE
  parent_id uuid;
  parent_level smallint;
BEGIN
  -- Travel Mugs → Drinkware
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Drinkware' LIMIT 1;
  IF parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'travel mugs' OR slug = 'travel-mugs') THEN
    INSERT INTO categories (name, slug, level, parent_id)
    VALUES ('Travel Mugs', 'travel-mugs', parent_level + 1, parent_id);
  END IF;

  -- Desk Gadgets → Office Supplies
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Office Supplies' LIMIT 1;
  IF parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'desk gadgets' OR slug = 'desk-gadgets') THEN
    INSERT INTO categories (name, slug, level, parent_id)
    VALUES ('Desk Gadgets', 'desk-gadgets', parent_level + 1, parent_id);
  END IF;

  -- Car Gadgets → Electronics Accessories
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Electronics Accessories' LIMIT 1;
  IF parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'car gadgets' OR slug = 'car-gadgets') THEN
    INSERT INTO categories (name, slug, level, parent_id)
    VALUES ('Car Gadgets', 'car-gadgets', parent_level + 1, parent_id);
  END IF;

  -- Home Accessories → Home & Garden
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Home & Garden' LIMIT 1;
  IF parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'home accessories' OR slug = 'home-accessories') THEN
    INSERT INTO categories (name, slug, level, parent_id)
    VALUES ('Home Accessories', 'home-accessories', parent_level + 1, parent_id);
  END IF;

  -- Passport Holders → Luggage Accessories
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Luggage Accessories' LIMIT 1;
  IF parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'passport holders' OR slug = 'passport-holders') THEN
    INSERT INTO categories (name, slug, level, parent_id)
    VALUES ('Passport Holders', 'passport-holders', parent_level + 1, parent_id);
  END IF;

  -- Outdoor Accessories → Sporting Goods
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Sporting Goods' LIMIT 1;
  IF parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'outdoor accessories' OR slug = 'outdoor-accessories') THEN
    INSERT INTO categories (name, slug, level, parent_id)
    VALUES ('Outdoor Accessories', 'outdoor-accessories', parent_level + 1, parent_id);
  END IF;

  -- Party Supplies children
  SELECT id, level INTO parent_id, parent_level FROM categories WHERE name = 'Party Supplies' LIMIT 1;
  IF parent_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'birthday party supplies' OR slug = 'birthday-party-supplies') THEN
      INSERT INTO categories (name, slug, level, parent_id)
      VALUES ('Birthday Party Supplies', 'birthday-party-supplies', parent_level + 1, parent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'graduation products' OR slug = 'graduation-products') THEN
      INSERT INTO categories (name, slug, level, parent_id)
      VALUES ('Graduation Products', 'graduation-products', parent_level + 1, parent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'baby shower products' OR slug = 'baby-shower-products') THEN
      INSERT INTO categories (name, slug, level, parent_id)
      VALUES ('Baby Shower Products', 'baby-shower-products', parent_level + 1, parent_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = 'photo props' OR slug = 'photo-props') THEN
      INSERT INTO categories (name, slug, level, parent_id)
      VALUES ('Photo Props', 'photo-props', parent_level + 1, parent_id);
    END IF;
  END IF;
END $$;
