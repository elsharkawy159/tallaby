-- 0052_templates.sql (PLAN.md §11.4, P1-02, D14)
--
-- Global, admin-authored store templates, mirroring the Valorcy reference
-- (templates / template_versions / template_installs), ready for a future
-- theme store (is_premium, price paid from the store wallet).
--
-- Seed: 'tallaby-classic' (the existing default storefront, PLAN.md §8.1) with
-- version 1 = a minimal valid SiteConfig v1. P4-03 replaces it with the full
-- classic template generated from packages/store-sections.
--
-- Idempotent. RLS enabled with no policies (server-side reads only).

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name jsonb NOT NULL,                                  -- {ar, en}
  description jsonb NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  thumbnail_url text,
  preview_url text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_premium boolean NOT NULL DEFAULT false,            -- future theme store
  price numeric(10,2),                                  -- future theme store
  sort_order integer NOT NULL DEFAULT 0,
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT templates_price_check CHECK (price IS NULL OR price >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS templates_one_default ON templates (is_default) WHERE is_default;

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  schema_version integer NOT NULL,
  config jsonb NOT NULL,                                -- SiteConfig
  changelog text,
  published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT template_versions_template_version_key UNIQUE (template_id, version)
);

ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE templates ADD CONSTRAINT templates_current_version_id_fkey
    FOREIGN KEY (current_version_id) REFERENCES template_versions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS template_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  template_version_id uuid REFERENCES template_versions(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  installed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  installed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS template_installs_store_idx ON template_installs (store_id, installed_at DESC);

ALTER TABLE template_installs ENABLE ROW LEVEL SECURITY;

-- Seed Tallaby Classic.
INSERT INTO templates (key, name, description, category, is_default, sort_order)
VALUES (
  'tallaby-classic',
  '{"ar": "طلبي الكلاسيكي", "en": "Tallaby Classic"}',
  '{"ar": "القالب الافتراضي لمتجرك", "en": "The default theme for your store"}',
  'general',
  true,
  0
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO template_versions (template_id, version, schema_version, config, changelog)
SELECT t.id, 1, 1,
  '{"schemaVersion": 1, "pages": [{"slug": "home", "isHome": true, "name": "الرئيسية", "content": {"sections": []}}]}'::jsonb,
  'Initial placeholder; replaced by the full classic template in P4-03'
FROM templates t
WHERE t.key = 'tallaby-classic'
ON CONFLICT (template_id, version) DO NOTHING;

UPDATE templates t SET current_version_id = v.id
FROM template_versions v
WHERE t.key = 'tallaby-classic' AND v.template_id = t.id AND v.version = 1
  AND t.current_version_id IS NULL;

-- Rollback: DROP TABLE template_installs, template_versions, templates CASCADE;
