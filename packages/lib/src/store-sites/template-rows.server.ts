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
import {
  CODE_TEMPLATES,
  DEFAULT_TEMPLATE,
  editionOnLook,
  getCodeTemplate,
  templateMeta,
  templateWithEdition,
  type TemplateDefinition,
  type TemplateMeta,
} from "@workspace/store-sections/templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const TEMPLATE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export type DbTemplate = { key: string; config: SiteConfig; meta: TemplateMeta };

/** Validated configs by key (null: the code template does not validate). Built once per server instance. */
const CONFIGS = new Map<string, SiteConfig | null>();

/**
 * The niche id of the edition a request may get on a template (niche
 * editions, ROADMAP F-90): the niche exists, the template is edition-ready
 * and the niche's pack is approved on it. Null for anything else, so a
 * made-up value from a client never reaches a cache key or a build.
 */
export function templateEditionId(key: string, editionId: unknown): string | null {
  return editionOnLook(key, editionId)?.niche ?? null;
}

/**
 * A code template's validated config, as a fresh copy (callers may change
 * it). Null for an unknown key or a config that does not validate: a broken
 * template is never offered and a new store never fails over one. With
 * `editionId` it is the look built with that niche's edition, and null when
 * the template does not offer the edition or the pack does not build on it
 * (a caller that falls back to the template's own content asks again
 * without it).
 */
export function codeTemplateConfig(key: string, editionId?: string | null): SiteConfig | null {
  if (typeof key !== "string" || !TEMPLATE_KEY_RE.test(key)) return null;
  const edition = editionId ? templateEditionId(key, editionId) : null;
  if (editionId && !edition) return null;
  // Only checked niche ids get here, so the map cannot grow past templates × editions.
  const id = edition ? `${key}@${edition}` : key;
  if (!CONFIGS.has(id)) {
    let parsed: ReturnType<typeof validateSiteConfig> | null = null;
    if (edition) {
      try {
        const built = templateWithEdition(key, edition);
        parsed = built ? validateSiteConfig(built.config()) : null;
      } catch {
        // A pack whose copy or links a look's sections do not hold throws when a page is built.
        parsed = null;
      }
    } else {
      const template = getCodeTemplate(key);
      parsed = template ? validateSiteConfig(template.config()) : null;
    }
    CONFIGS.set(id, parsed?.success ? parsed.data : null);
  }
  const config = CONFIGS.get(id);
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

/**
 * A template's meta (page names, demo catalog, swatches). Null for an unknown
 * key. With an edition the template offers, the demo catalog is the
 * edition's; any other `editionId` gives the template's own.
 */
export async function getTemplateMeta(key: string, _q?: Queryable, editionId?: string | null): Promise<TemplateMeta | null> {
  if (typeof key !== "string" || !TEMPLATE_KEY_RE.test(key)) return null;
  // The edition's demo only with a config that builds, so the catalog always matches the pages shown.
  const built = editionId && codeTemplateConfig(key, editionId) ? templateWithEdition(key, editionId) : undefined;
  const template = built ?? getCodeTemplate(key);
  return template ? templateMeta(template) : null;
}

/**
 * A template's config and meta with no store involved (the tallaby.com
 * gallery preview). Null for an unknown key or a broken config. With
 * `editionId` it is the look with that niche's edition (`edition` names
 * it); an edition the template does not offer, or one that does not build,
 * gives the template's own content (`edition: null`).
 */
export async function getPublicTemplate(
  key: string,
  _q?: Queryable,
  editionId?: string | null,
): Promise<{ config: SiteConfig; meta: TemplateMeta; edition: string | null } | null> {
  const edition = templateEditionId(key, editionId);
  const withEdition = edition ? codeTemplateConfig(key, edition) : null;
  const built = withEdition ? templateWithEdition(key, edition) : undefined;
  if (withEdition && built) return { config: withEdition, meta: templateMeta(built), edition };
  const config = codeTemplateConfig(key);
  const template = config ? getCodeTemplate(key) : undefined;
  return config && template ? { config, meta: templateMeta(template), edition: null } : null;
}
