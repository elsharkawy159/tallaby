-- 0109_drop_template_library.sql
--
-- Storefront templates and the section library are code-only (owner,
-- 2026-10-27): CODE_TEMPLATES and DESIGNS in @workspace/store-sections are the
-- single source, edited in code and shipped with a deploy. Step 2 of 2: apply
-- AFTER the code that no longer reads these tables is deployed (the old code
-- reads them on every template gallery, "Use template" and new store).
--
-- DESTRUCTIVE (owner approved, 2026-10-27; admin edits discarded):
--   * drops templates, template_versions and library_sections;
--   * template_installs keeps every row (sellers' install history and undo
--     drafts): template_key becomes required and the template_id /
--     template_version_id columns and their foreign keys go. The foreign keys
--     are dropped FIRST: template_installs_template_id_fkey is ON DELETE
--     CASCADE, so dropping templates with it in place would delete installs.
--
-- Not reversible except from a backup. Idempotent.

-- 1. Last fill of template_key (rows written since 0108), while the tables still exist.
DO $do$
BEGIN
  IF to_regclass('public.templates') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'template_installs' AND column_name = 'template_id') THEN
    UPDATE template_installs ti SET template_key = t.key
    FROM templates t WHERE t.id = ti.template_id AND ti.template_key IS NULL;
  END IF;
END
$do$;
UPDATE template_installs SET template_key = 'unknown' WHERE template_key IS NULL;
ALTER TABLE template_installs ALTER COLUMN template_key SET NOT NULL;

-- 2. template_installs no longer points at the template tables.
DROP TRIGGER IF EXISTS template_installs_fill_key ON template_installs;
DROP FUNCTION IF EXISTS template_installs_fill_key();
ALTER TABLE template_installs DROP CONSTRAINT IF EXISTS template_installs_template_id_fkey;
ALTER TABLE template_installs DROP CONSTRAINT IF EXISTS template_installs_template_version_id_fkey;
ALTER TABLE template_installs DROP COLUMN IF EXISTS template_version_id;
ALTER TABLE template_installs DROP COLUMN IF EXISTS template_id;

-- 3. The template and section library tables (they reference each other: templates.current_version_id).
ALTER TABLE IF EXISTS templates DROP CONSTRAINT IF EXISTS templates_current_version_id_fkey;
DROP TABLE IF EXISTS template_versions;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS library_sections;

-- The `library-media` storage bucket (0086) is left in place (empty on staging);
-- remove it from the Supabase dashboard if it is empty there too.
