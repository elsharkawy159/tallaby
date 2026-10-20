/**
 * Storefront templates defined in code (Claude Design "Storefront
 * Templates", 2026-10-19). Each is seeded into `templates` /
 * `template_versions` by a generated migration (`templateSeedSql`, run with
 * `pnpm --filter @workspace/store-sections template:sql <key> <file>`); the
 * gallery, apply and undo read the database rows (P4-05). The code copy adds
 * what the database does not hold: the preview catalog and page names.
 * No React here.
 */
import { validateSiteConfig } from "../config/validate";
import type { Design } from "../designs/builder";
import { ATELIER } from "./atelier";
import { CLASSIC } from "./classic";
import { MODE } from "./mode";
import { STREETWEAR } from "./streetwear";
import { KASR } from "./kasr";
import { TECHHUB } from "./techhub";
import { VOLT } from "./volt";
import { ARCADE } from "./arcade";
import { ARENA } from "./arena";
import { PURE } from "./pure";
import { GLOW } from "./glow";
import { ELIXIR } from "./elixir";
import { BOTANICA } from "./botanica";
import { NEST } from "./nest";
import { DAILY } from "./daily";
import { HEARTH } from "./hearth";
import { CLAY } from "./clay";
import { SIZZLE } from "./sizzle";
import { HARVEST } from "./harvest";
import { LOAF } from "./loaf";
import { ROAST } from "./roast";
import { VERDANT } from "./verdant";
import { LOFT } from "./loft";
import { OAK } from "./oak";
import { SAKAN } from "./sakan";
import { LUMIERE } from "./lumiere";
import { KARAT } from "./karat";
import { FADDA } from "./fadda";
import { PLAYROOM } from "./playroom";
import { BAMBINO } from "./bambino";
import { DOODLE } from "./doodle";
import { HEKAYA } from "./hekaya";
import { PACE } from "./pace";
import { STRIDE } from "./stride";
import { CORE } from "./core";
import { BASECAMP } from "./basecamp";
import { GARAGE } from "./garage";
import { DRIVE } from "./drive";
import { MOTO } from "./moto";
import type { TemplateDefinition } from "./types";

/** Templates 02–38, built from section-library designs (`library-template.ts`), in registry order. */
export const LIBRARY_TEMPLATES: readonly TemplateDefinition[] = [MODE, STREETWEAR, KASR, TECHHUB, VOLT, ARCADE, ARENA, PURE, GLOW, ELIXIR, BOTANICA, NEST, DAILY, HEARTH, CLAY, SIZZLE, HARVEST, LOAF, ROAST, VERDANT, LOFT, OAK, SAKAN, LUMIERE, KARAT, FADDA, PLAYROOM, BAMBINO, DOODLE, HEKAYA, PACE, STRIDE, CORE, BASECAMP, GARAGE, DRIVE, MOTO];

export const CODE_TEMPLATES: readonly TemplateDefinition[] = [CLASSIC, ATELIER, ...LIBRARY_TEMPLATES];

/** The default template: a new store's starting site (`templates.is_default`). */
export const DEFAULT_TEMPLATE: TemplateDefinition = CLASSIC;

const BY_KEY = new Map(CODE_TEMPLATES.map((template) => [template.key, template]));

export function getCodeTemplate(key: string): TemplateDefinition | undefined {
  return BY_KEY.get(key);
}

const DESIGNS = new Map(CODE_TEMPLATES.flatMap((template) => template.designs).map((design) => [design.id, design]));

/** A template's own section design by id (template designs are not in the section library). */
export function getTemplateDesign(id: string): Design | undefined {
  return DESIGNS.get(id);
}

export const TEMPLATE_JSON_START = "-- template-config:start";
export const TEMPLATE_JSON_END = "-- template-config:end";

/** The validated config as stored in `template_versions.config`. */
export function templateConfigJson(template: TemplateDefinition): string {
  const result = validateSiteConfig(template.config());
  if (!result.success) throw new Error(`Template ${template.key} is invalid: ${JSON.stringify(result.issues)}`);
  return JSON.stringify(result.data);
}

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;

const ROW_NOTE = `Adds the template row (never
-- the default; the store keeps its own until the seller uses it) and makes
-- this version current.`;

const DEFAULT_ROW_NOTE = `Adds or updates the template row as
-- THE default (what new stores start from; any other default is cleared)
-- and makes this version current. Stores' drafts and live sites are not
-- touched.`;

const DEFAULT_CONFLICT = `ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_default = true,
  is_active = true,
  is_premium = false,
  updated_at = now();`;

/** One default at a time (the `templates_one_default` index): clear any other first. */
function defaultOnly(template: TemplateDefinition): string {
  return `
UPDATE templates SET is_default = false, updated_at = now()
WHERE is_default AND key <> ${sqlText(template.key)};
`;
}

/** The default's row stays (stores point at its key), and so does a later version's: roll back to the version before. */
function versionRollback(template: TemplateDefinition): string {
  return `-- Rollback: make version ${template.version - 1} current again, then remove version ${template.version}:
--   UPDATE templates t SET current_version_id = v.id FROM template_versions v
--   WHERE t.key = ${sqlText(template.key)} AND v.template_id = t.id AND v.version = ${template.version - 1};
--   DELETE FROM template_versions v USING templates t
--   WHERE t.key = ${sqlText(template.key)} AND v.template_id = t.id AND v.version = ${template.version};`;
}

/** One migration for a batch of templates: each template's seed in turn (`template:sql key1,key2 <file>`). */
export function templatesSeedSql(templates: readonly TemplateDefinition[], migrationName: string): string {
  return templates.map((template) => templateSeedSql(template, migrationName)).join("\n");
}

/** An idempotent migration that adds the template and makes this version current. */
export function templateSeedSql(template: TemplateDefinition, migrationName: string): string {
  return `-- ${migrationName} (storefront templates, 2026-10-19)
--
-- Storefront template "${template.name.en}" v${template.version}, generated from
-- packages/store-sections/src/templates/${template.folder ?? template.key}/ by
-- \`pnpm --filter @workspace/store-sections template:sql ${template.key} ${migrationName}\`.
-- A test checks this file matches the package. ${template.isDefault ? DEFAULT_ROW_NOTE : ROW_NOTE}
--
-- Idempotent.
${template.isDefault ? defaultOnly(template) : ""}
INSERT INTO templates (key, name, description, category, sort_order, is_default, is_active, is_premium)
VALUES (
  ${sqlText(template.key)},
  ${sqlText(JSON.stringify(template.name))}::jsonb,
  ${sqlText(JSON.stringify(template.description))}::jsonb,
  ${sqlText(template.category)},
  ${template.sortOrder},
  ${template.isDefault ? "true" : "false"},
  true,
  false
)
${template.isDefault ? DEFAULT_CONFLICT : "ON CONFLICT (key) DO NOTHING;"}

INSERT INTO template_versions (template_id, version, schema_version, config, changelog)
SELECT t.id, ${template.version}, 1,
${TEMPLATE_JSON_START}
${sqlText(templateConfigJson(template))}::jsonb,
${TEMPLATE_JSON_END}
  ${sqlText(template.changelog)}
FROM templates t
WHERE t.key = ${sqlText(template.key)}
ON CONFLICT (template_id, version) DO NOTHING;

UPDATE templates t SET current_version_id = v.id, updated_at = now()
FROM template_versions v
WHERE t.key = ${sqlText(template.key)} AND v.template_id = t.id AND v.version = ${template.version}
  AND t.current_version_id IS DISTINCT FROM v.id;

${template.isDefault || template.version > 1 ? versionRollback(template) : `-- Rollback: DELETE FROM templates WHERE key = ${sqlText(template.key)}; (cascades to its versions and installs).`}
`;
}
