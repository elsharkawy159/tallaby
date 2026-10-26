-- 0108_template_installs_template_key.sql
--
-- Storefront templates and the section library become code-only (owner,
-- 2026-10-27; @workspace/store-sections CODE_TEMPLATES / DESIGNS). Step 1 of 2:
-- apply BEFORE deploying the code that stops reading the template tables.
--
-- template_installs (sellers' "Use template" history and its undo drafts,
-- 0064) records the template by key and version instead of a templates row:
--   * adds template_key / template_version, filled from templates and
--     template_versions for every existing install;
--   * template_id becomes nullable (the new code never sends it);
--   * until 0109, a trigger fills template_key for installs the old code
--     still writes by template_id.
--
-- Additive and idempotent: the old code keeps working. 0109 (after the deploy)
-- makes template_key required and drops the template tables.

ALTER TABLE template_installs ADD COLUMN IF NOT EXISTS template_key text;
ALTER TABLE template_installs ADD COLUMN IF NOT EXISTS template_version integer;

UPDATE template_installs ti
SET template_key = t.key
FROM templates t
WHERE t.id = ti.template_id AND ti.template_key IS NULL;

UPDATE template_installs ti
SET template_version = v.version
FROM template_versions v
WHERE v.id = ti.template_version_id AND ti.template_version IS NULL;

ALTER TABLE template_installs ALTER COLUMN template_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION template_installs_fill_key() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.template_key IS NULL AND NEW.template_id IS NOT NULL THEN
    SELECT key INTO NEW.template_key FROM templates WHERE id = NEW.template_id;
  END IF;
  IF NEW.template_version IS NULL AND NEW.template_version_id IS NOT NULL THEN
    SELECT version INTO NEW.template_version FROM template_versions WHERE id = NEW.template_version_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS template_installs_fill_key ON template_installs;
CREATE TRIGGER template_installs_fill_key
BEFORE INSERT ON template_installs
FOR EACH ROW EXECUTE FUNCTION template_installs_fill_key();

-- Rollback (before 0109 only):
--   DROP TRIGGER IF EXISTS template_installs_fill_key ON template_installs;
--   DROP FUNCTION IF EXISTS template_installs_fill_key();
--   ALTER TABLE template_installs DROP COLUMN IF EXISTS template_version, DROP COLUMN IF EXISTS template_key;
--   (template_id stays nullable unless every row still has one: ALTER ... SET NOT NULL.)
