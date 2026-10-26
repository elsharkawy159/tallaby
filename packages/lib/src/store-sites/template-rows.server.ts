/**
 * Storefront templates come from the codebase only (owner, 2026-10-27): the
 * code catalog (`CODE_TEMPLATES` in @workspace/store-sections/templates) is
 * the single source, so templates are edited and improved in code and ship
 * with a deploy. The `templates`, `template_versions` and `library_sections`
 * tables were dropped (0109). This module keeps the names the rest of the
 * app calls (the default template a new store starts from, a template's
 * meta, the public preview).
 *
 * Kept apart from templates.server.ts so the store scaffold
 * (stores/starter-site.server.ts) can use it without an import cycle;
 * templates.server.ts re-exports it. Server-only. Templates are global
 * platform data, so nothing here is scoped to a seller. The `q` parameters
 * stay for callers that pass a transaction; nothing here reads the database.
 */
import type { db } from "@workspace/db";
import { validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
import { CODE_TEMPLATES, DEFAULT_TEMPLATE, getCodeTemplate, templateMeta, type TemplateDefinition, type TemplateMeta } from "@workspace/store-sections/templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const TEMPLATE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export type DbTemplate = { key: string; config: SiteConfig; meta: TemplateMeta };

/** Validated configs by key (null: the code template does not validate). Built once per server instance. */
const CONFIGS = new Map<string, SiteConfig | null>();

/**
 * A code template's validated config, as a fresh copy (callers may change
 * it). Null for an unknown key or a config that does not validate: a broken
 * template is never offered and a new store never fails over one.
 */
export function codeTemplateConfig(key: string): SiteConfig | null {
  if (typeof key !== "string" || !TEMPLATE_KEY_RE.test(key)) return null;
  if (!CONFIGS.has(key)) {
    const template = getCodeTemplate(key);
    const parsed = template ? validateSiteConfig(template.config()) : null;
    CONFIGS.set(key, parsed?.success ? parsed.data : null);
  }
  const config = CONFIGS.get(key);
  return config ? structuredClone(config) : null;
}

/** Every offered template: the default first, then by `sortOrder`. */
export function offeredTemplates(): TemplateDefinition[] {
  return [...CODE_TEMPLATES].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault) || a.sortOrder - b.sortOrder);
}

/** The default template (`DEFAULT_TEMPLATE`, Tallaby Classic) with its config and meta. Null when its config does not validate. */
export async function loadDefaultTemplate(_q?: Queryable): Promise<DbTemplate | null> {
  const config = codeTemplateConfig(DEFAULT_TEMPLATE.key);
  return config ? { key: DEFAULT_TEMPLATE.key, config, meta: templateMeta(DEFAULT_TEMPLATE) } : null;
}

/** A template's meta (page names, demo catalog, swatches). Null for an unknown key. */
export async function getTemplateMeta(key: string, _q?: Queryable): Promise<TemplateMeta | null> {
  const template = typeof key === "string" && TEMPLATE_KEY_RE.test(key) ? getCodeTemplate(key) : undefined;
  return template ? templateMeta(template) : null;
}

/** A template's config and meta with no store involved (the tallaby.com gallery preview). Null for an unknown key or a broken config. */
export async function getPublicTemplate(key: string, _q?: Queryable): Promise<{ config: SiteConfig; meta: TemplateMeta } | null> {
  const config = codeTemplateConfig(key);
  const template = config ? getCodeTemplate(key) : undefined;
  return config && template ? { config, meta: templateMeta(template) } : null;
}
