import { productPageOf } from "../config/product-page.lib";
import { validateSiteConfig } from "../config/validate";
import { PRODUCT_PAGE_NAME } from "./_product-page";
import type { TemplateDefinition } from "./types";

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;

/** The template's validated product page, as JSON (the same validation `templateConfigJson` runs). */
export function productPageJson(template: TemplateDefinition): string {
  const result = validateSiteConfig(template.config());
  if (!result.success) throw new Error(`Template ${template.key} is invalid: ${JSON.stringify(result.issues)}`);
  const page = productPageOf(result.data);
  if (!page) throw new Error(`Template ${template.key} has no product page`);
  return JSON.stringify(page);
}

const NO_PRODUCT_PAGE = (config: string) => `NOT EXISTS (SELECT 1 FROM jsonb_array_elements(${config}->'pages') p WHERE p->>'kind' = 'product')`;
const NO_PRODUCT_SLUG = (config: string) => `NOT EXISTS (SELECT 1 FROM jsonb_array_elements(${config}->'pages') p WHERE p->>'slug' = 'product')`;

function templateBlock(template: TemplateDefinition): string {
  const key = sqlText(template.key);
  const page = sqlText(productPageJson(template));
  const name = sqlText(JSON.stringify(template.pageNames.product ?? PRODUCT_PAGE_NAME));
  return `-- ${template.key}
-- Lock the template row (as publishTemplateVersion does) before max(version) + 1.
SELECT 1 FROM templates WHERE key = ${key} AND deleted_at IS NULL FOR UPDATE;

-- Draft: the page is appended to an admin draft that has none.
UPDATE templates t
SET draft_config = jsonb_set(t.draft_config, '{pages}', (t.draft_config->'pages') || ${page}::jsonb),
    draft_version = t.draft_version + 1,
    draft_updated_at = now()
WHERE t.key = ${key} AND t.deleted_at IS NULL
  AND t.draft_config IS NOT NULL AND jsonb_typeof(t.draft_config->'pages') = 'array'
  AND ${NO_PRODUCT_PAGE("t.draft_config")}
  AND ${NO_PRODUCT_SLUG("t.draft_config")};

-- Version: current config + the page, as version max + 1, made current.
WITH cur AS (
  SELECT t.id AS template_id, v.config, v.schema_version
  FROM templates t
  JOIN template_versions v ON v.id = t.current_version_id
  WHERE t.key = ${key} AND t.deleted_at IS NULL
    AND jsonb_typeof(v.config->'pages') = 'array'
), new_version AS (
  INSERT INTO template_versions (template_id, version, schema_version, config, changelog)
  SELECT cur.template_id,
    (SELECT max(v.version) + 1 FROM template_versions v WHERE v.template_id = cur.template_id),
    cur.schema_version,
    jsonb_set(cur.config, '{pages}', (cur.config->'pages') || ${page}::jsonb),
    'product page'
  FROM cur
  WHERE ${NO_PRODUCT_PAGE("cur.config")}
    AND ${NO_PRODUCT_SLUG("cur.config")}
  RETURNING id, template_id
)
UPDATE templates t SET current_version_id = nv.id, updated_at = now()
FROM new_version nv
WHERE t.id = nv.template_id;

-- Meta: the page's gallery name, never overwriting an existing value.
UPDATE templates t
SET meta = jsonb_set(t.meta, '{pageNames}', COALESCE(t.meta->'pageNames', '{}'::jsonb) || jsonb_build_object('product', ${name}::jsonb))
WHERE t.key = ${key} AND t.deleted_at IS NULL
  AND t.meta->'pageNames'->'product' IS NULL;
`;
}

/**
 * One idempotent migration adding each template's product page to the DB
 * copy: its current version (as a new version), an admin draft and `meta`.
 * A template missing from the database (or soft-deleted) matches no row and
 * is skipped. Every block is guarded by "no product page yet", so a second
 * run changes nothing.
 */
export function templatesProductPageSql(templates: readonly TemplateDefinition[], migrationName: string): string {
  return `-- ${migrationName} (storefront templates, 2026-10-23)
--
-- Adds each template's product page (kind = 'product', slug 'product') to the
-- database copy, generated from the code templates by
-- \`pnpm --filter @workspace/store-sections template:product-page-sql ../db/migrations/${migrationName}\`.
-- Per template, in one transaction:
--   1. an admin draft (draft_config) without a product page gets it appended;
--   2. the current version gets a new version (max + 1, "product page") with
--      the page appended, and becomes current;
--   3. meta.pageNames.product is filled when missing.
-- Templates that exist in code but not in the database (or are soft-deleted)
-- match no row and are skipped. Every block is guarded by "no product page
-- yet", so it is idempotent. Stores' drafts and live sites are not touched.
--
-- Rollback (per template): make the previous version current again, then
-- delete the version whose changelog is 'product page'.

BEGIN;

${templates.map(templateBlock).join("\n")}
COMMIT;
`;
}
