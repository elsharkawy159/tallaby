-- 0091_rename_botanica_sage.sql: the Botanica library template is shown as Sage (سيج) (owner, 2026-10-21).
-- Display name only: the key stays 'botanica' so stores.template_key, installs and the /templates/botanica URL are untouched.
-- Guarded: renames only while the name is still the seeded one, so an admin's own rename is kept and a re-run is a no-op.

UPDATE templates
SET name = '{"ar":"سيج","en":"Sage"}'::jsonb, updated_at = now()
WHERE key = 'botanica'
  AND name = '{"ar":"بوتانيكا","en":"Botanica"}'::jsonb;
