/**
 * Storefront templates defined in code (Claude Design "Storefront
 * Templates", 2026-10-19). Each is seeded into `templates` /
 * `template_versions` by a generated migration (`templateSeedSql`, run with
 * `pnpm --filter @workspace/store-sections template:sql <key> <file>`); the
 * gallery, apply and undo read the database rows (P4-05). The code copy adds
 * what the database does not hold: the preview catalog and page names.
 * No React here.
 */
import { sanitizeSiteConfig } from "../config/sanitize";
import { validateSiteConfig } from "../config/validate";
import type { Localized } from "../core/types";
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
import { KETTAN } from "./kettan";
import { ZAY } from "./zay";
import { SITARA } from "./sitara";
import { SHANTA } from "./shanta";
import { TASFYA } from "./tasfya";
import { KABL } from "./kabl";
import { SADA } from "./sada";
import { ZAKI } from "./zaki";
import { SAA } from "./saa";
import { TANY } from "./tany";
import { NADA } from "./nada";
import { KOHL } from "./kohl";
import { OUD } from "./oud";
import { SABON } from "./sabon";
import { BARBER } from "./barber";
import { MATBAKH } from "./matbakh";
import { FOKHAR } from "./fokhar";
import { TAWLA } from "./tawla";
import { TANZIM } from "./tanzim";
import { QAHWA } from "./qahwa";
import { KHODAR } from "./khodar";
import { LAHMA } from "./lahma";
import { HALAWA } from "./halawa";
import { ATARA } from "./atara";
import { DOKAN } from "./dokan";
import { BUNN } from "./bunn";
import { MOBILIA } from "./mobilia";
import { ZAREA } from "./zarea";
import { NOUR } from "./nour";
import { MAFRASH } from "./mafrash";
import { ROKN } from "./rokn";
import { ZAHRA } from "./zahra";
import { NUQRA } from "./nuqra";
import { LULU } from "./lulu";
import { SAAT } from "./saat";
import { MAHR } from "./mahr";
import { LEGO } from "./lego";
import { MAMA } from "./mama";
import { MADRASA } from "./madrasa";
import { HIKAYA } from "./hikaya";
import { AHLAM } from "./ahlam";
import { YOGA } from "./yoga";
import { KOORA } from "./koora";
import { DARRAGA } from "./darraga";
import { SABAHA } from "./sabaha";
import { BOXING } from "./boxing";
import { TYRE } from "./tyre";
import { ZEINA } from "./zeina";
import { KAHRABA } from "./kahraba";
import { SAFAR } from "./safar";
import { GARAGY } from "./garagy";
import { BASHRA } from "./bashra";
import { SUFRA } from "./sufra";
import { SABAHO } from "./sabaho";
import { DAR } from "./dar";
import { SHABKA } from "./shabka";
import { HADAYA } from "./hadaya";
import { REP } from "./rep";
import { PITSTOP } from "./pitstop";
import { GHORZA } from "./ghorza";
import { MAWSEM } from "./mawsem";
import { SHASHA } from "./shasha";
import { WARD } from "./ward";
import { BEITY } from "./beity";
import { SOUQ } from "./souq";
import { SALON } from "./salon";
import { KHOLKHAL } from "./kholkhal";
import { FARHA } from "./farha";
import { NASHAT } from "./nashat";
import { TARIK } from "./tarik";
import { FURNITURE_BOLD } from "./furniture-bold";
import { FURNITURE_LUXE } from "./furniture-luxe";
import { FURNITURE_WARM } from "./furniture-warm";
import { FASHION_BOLD } from "./fashion-bold";
import { FASHION_LUXE } from "./fashion-luxe";
import { FASHION_WARM } from "./fashion-warm";
import { ELECTRONICS_BOLD } from "./electronics-bold";
import { ELECTRONICS_LUXE } from "./electronics-luxe";
import { ELECTRONICS_WARM } from "./electronics-warm";
import { KIDS_BOLD } from "./kids-bold";
import { KIDS_LUXE } from "./kids-luxe";
import { KIDS_WARM } from "./kids-warm";
import { BEAUTY_BOLD } from "./beauty-bold";
import { BEAUTY_LUXE } from "./beauty-luxe";
import { BEAUTY_WARM } from "./beauty-warm";
import { GROCERY_BOLD } from "./grocery-bold";
import { GROCERY_LUXE } from "./grocery-luxe";
import { GROCERY_WARM } from "./grocery-warm";
import { PERFUMES_BOLD } from "./perfumes-bold";
import { PERFUMES_LUXE } from "./perfumes-luxe";
import { PERFUMES_WARM } from "./perfumes-warm";
import { JEWELRY_BOLD } from "./jewelry-bold";
import { JEWELRY_LUXE } from "./jewelry-luxe";
import { JEWELRY_WARM } from "./jewelry-warm";
import { GIFTS_BOLD } from "./gifts-bold";
import { GIFTS_LUXE } from "./gifts-luxe";
import { GIFTS_WARM } from "./gifts-warm";
import { SPORTS_BOLD } from "./sports-bold";
import { SPORTS_LUXE } from "./sports-luxe";
import { SPORTS_WARM } from "./sports-warm";
import { WASLA } from "./wasla";
import { templateRefConfig } from "./ref-config";
import type { TemplateDefinition, TemplateDemo } from "./types";

/** Templates 02–110, built from section-library designs (`library-template.ts`), in registry order. */
export const LIBRARY_TEMPLATES: readonly TemplateDefinition[] = [MODE, STREETWEAR, KASR, TECHHUB, VOLT, ARCADE, ARENA, PURE, GLOW, ELIXIR, BOTANICA, NEST, DAILY, HEARTH, SIZZLE, HARVEST, LOAF, ROAST, VERDANT, LOFT, OAK, SAKAN, LUMIERE, KARAT, FADDA, PLAYROOM, BAMBINO, DOODLE, HEKAYA, PACE, STRIDE, CORE, BASECAMP, GARAGE, DRIVE, MOTO,
  BASHRA, SUFRA, SABAHO, DAR, SHABKA, HADAYA, REP, PITSTOP, GHORZA,
  KETTAN, ZAY, SITARA, SHANTA, TASFYA, KABL, SADA, ZAKI, SAA, TANY, NADA, KOHL, OUD, SABON, BARBER, MATBAKH, FOKHAR, TAWLA, TANZIM, QAHWA, KHODAR, LAHMA, HALAWA, ATARA, DOKAN, BUNN, MOBILIA, ZAREA, NOUR, MAFRASH, ROKN, ZAHRA, NUQRA, LULU, SAAT, MAHR, LEGO, MAMA, MADRASA, HIKAYA, AHLAM, YOGA, KOORA, DARRAGA, SABAHA, BOXING, TYRE, ZEINA, KAHRABA, SAFAR, GARAGY,
  MAWSEM, SHASHA, WARD, BEITY, SOUQ, SALON, KHOLKHAL, FARHA, NASHAT, TARIK,
  // Niche templates (2026-10-28): three per niche, with the 12-slot home (top bar to footer).
  FURNITURE_LUXE, FURNITURE_BOLD, FURNITURE_WARM,
  FASHION_LUXE, FASHION_BOLD, FASHION_WARM,
  ELECTRONICS_LUXE, ELECTRONICS_BOLD, ELECTRONICS_WARM,
  KIDS_LUXE, KIDS_BOLD, KIDS_WARM,
  BEAUTY_LUXE, BEAUTY_BOLD, BEAUTY_WARM,
  GROCERY_LUXE, GROCERY_BOLD, GROCERY_WARM,
  PERFUMES_LUXE, PERFUMES_BOLD, PERFUMES_WARM,
  JEWELRY_LUXE, JEWELRY_BOLD, JEWELRY_WARM,
  GIFTS_LUXE, GIFTS_BOLD, GIFTS_WARM,
  SPORTS_LUXE, SPORTS_BOLD, SPORTS_WARM,
  // After the WoodMart "Accessories" demo's layout (2026-10-29).
  WASLA,
];

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

/**
 * The hand-built templates' own designs (Classic, Atelier), which are library
 * sections too (owner, 2026-10-26; hidden from the sellers' Add palette, 0105),
 * so these templates are stored as refs like the others. Their library key is
 * the design id.
 */
export const TEMPLATE_OWN_DESIGNS: readonly Design[] = [...CLASSIC.designs, ...ATELIER.designs];

const OWN = new Map(TEMPLATE_OWN_DESIGNS.map((design) => [design.id, design]));

/** A Classic / Atelier design by its library key. */
export function getTemplateOwnDesign(key: string): Design | undefined {
  return OWN.get(key);
}

export const TEMPLATE_JSON_START = "-- template-config:start";
export const TEMPLATE_JSON_END = "-- template-config:end";

/**
 * The validated config as stored in `template_versions.config`: its library
 * sections as refs (`templateRefConfig`), built from the library's current
 * trees when read, so later library edits reach the template.
 */
export function templateConfigJson(template: TemplateDefinition): string {
  const result = validateSiteConfig(template.config());
  if (!result.success) throw new Error(`Template ${template.key} is invalid: ${JSON.stringify(result.issues)}`);
  return JSON.stringify(templateRefConfig(template, result.data, { normalize: sanitizeSiteConfig }));
}

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;

const ROW_NOTE = `Adds the template row (never
-- the default; the store keeps its own until the seller uses it) and its
-- version, only when the key is new.`;

const DEFAULT_ROW_NOTE = `Adds the template row as THE
-- default (what new stores start from; any other default is cleared), and
-- its version, only when the key is new. Stores' drafts and live sites are
-- not touched.`;

/** One default at a time (the `templates_one_default` index): clear any other first, only when this key is new. */
function defaultOnly(template: TemplateDefinition): string {
  return `
UPDATE templates SET is_default = false, updated_at = now()
WHERE is_default AND key <> ${sqlText(template.key)}
  AND NOT EXISTS (SELECT 1 FROM templates WHERE key = ${sqlText(template.key)});
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

/**
 * An idempotent, INSERT-ONLY migration (the database is the master copy,
 * edited in Admin): a template whose key already exists is left completely
 * alone, current version included. One statement inserts the template, its
 * version and the `current_version_id` link (both foreign keys are checked
 * at the end of the statement), driven by `RETURNING` on the template insert.
 */
export function templateSeedSql(template: TemplateDefinition, migrationName: string): string {
  return `-- ${migrationName} (storefront templates, 2026-10-19)
--
-- Storefront template "${template.name.en}" v${template.version}, generated from
-- packages/store-sections/src/templates/${template.folder ?? template.key}/ by
-- \`pnpm --filter @workspace/store-sections template:sql ${template.key} ${migrationName}\`.
-- Insert-only: ${template.isDefault ? DEFAULT_ROW_NOTE : ROW_NOTE}
-- An existing template (and its current version) is never changed.
--
-- Idempotent.
${template.isDefault ? defaultOnly(template) : ""}
WITH ids AS (
  SELECT gen_random_uuid() AS template_id, gen_random_uuid() AS version_id
), new_template AS (
  INSERT INTO templates (id, key, name, description, category, sort_order, is_default, is_active, is_premium, current_version_id)
  SELECT
    ids.template_id,
    ${sqlText(template.key)},
    ${sqlText(JSON.stringify(template.name))}::jsonb,
    ${sqlText(JSON.stringify(template.description))}::jsonb,
    ${sqlText(template.category)},
    ${template.sortOrder},
    ${template.isDefault ? "true" : "false"},
    true,
    false,
    ids.version_id
  FROM ids
  ON CONFLICT (key) DO NOTHING
  RETURNING id, current_version_id
)
INSERT INTO template_versions (id, template_id, version, schema_version, config, changelog)
SELECT nt.current_version_id, nt.id, ${template.version}, 1,
${TEMPLATE_JSON_START}
${sqlText(templateConfigJson(template))}::jsonb,
${TEMPLATE_JSON_END}
  ${sqlText(template.changelog)}
FROM new_template nt;

${template.isDefault || template.version > 1 ? versionRollback(template) : `-- Rollback: DELETE FROM templates WHERE key = ${sqlText(template.key)}; (cascades to its versions and installs).`}
`;
}

/** What the database holds beside the config (`templates.meta`): code-only data the gallery needs. */
export type TemplateMeta = {
  pageNames: Record<string, Localized>;
  demo: TemplateDemo;
  palette: string[];
};

export function templateMeta(template: TemplateDefinition): TemplateMeta {
  return { pageNames: { ...template.pageNames }, demo: template.demo, palette: [...template.palette] };
}

/**
 * `UPDATE templates SET meta = … WHERE key = … AND meta = '{}'` for each
 * template: fills the empty meta once and never overwrites admin-edited meta.
 * Deterministic output (0087 is checked against it).
 */
export function templatesMetaSql(templates: readonly TemplateDefinition[]): string {
  return (
    templates
      .map((template) => `UPDATE templates SET meta = ${sqlText(JSON.stringify(templateMeta(template)))}::jsonb WHERE key = ${sqlText(template.key)} AND meta = '{}'::jsonb;`)
      .join("\n") + "\n"
  );
}
