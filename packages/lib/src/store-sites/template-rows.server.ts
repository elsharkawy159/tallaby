/**
 * Template rows read straight from the database (admin website builder §5.4):
 * the default template a new store starts from, and a template's `meta`
 * (page names, demo catalog, swatches). The database is the master copy; the
 * code templates are only the seed and the per-field fallback
 * (`resolveTemplateMeta`). Soft-deleted (`deleted_at`) and hidden
 * (`is_active = false`) templates are never returned.
 *
 * Kept apart from templates.server.ts so the store scaffold
 * (stores/starter-site.server.ts) can use it without an import cycle;
 * templates.server.ts re-exports it. Server-only. Templates are global
 * admin-authored data, so nothing here is scoped to a seller.
 */
import { and, db, eq, isNull, templateVersions, templates } from "@workspace/db";
import { siteConfigSchema, validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
import { resolveTemplateMeta, type TemplateMeta } from "@workspace/store-sections/templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const TEMPLATE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export type DbTemplate = { key: string; config: SiteConfig; meta: TemplateMeta };

/** Offered templates: active and not soft-deleted. */
export const offeredTemplate = () => and(eq(templates.isActive, true), isNull(templates.deletedAt));

/**
 * The default template (`is_default`) with its current version, in the
 * caller's transaction when given one. Null when there is none or its
 * current version does not pass `validateSiteConfig` (a new store must
 * never fail to be created over a broken default).
 */
export async function loadDefaultTemplate(q: Queryable = db): Promise<DbTemplate | null> {
  const [row] = await q
    .select({ key: templates.key, meta: templates.meta, config: templateVersions.config })
    .from(templates)
    .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
    .where(and(eq(templates.isDefault, true), offeredTemplate()))
    .limit(1);
  if (!row) return null;
  const config = validateSiteConfig(row.config);
  return config.success ? { key: row.key, config: config.data, meta: resolveTemplateMeta(row.meta, row.key) } : null;
}

/** An offered template's meta (database first, code fallback per field). Null for an unknown, hidden or deleted key. */
export async function getTemplateMeta(key: string, q: Queryable = db): Promise<TemplateMeta | null> {
  if (typeof key !== "string" || !TEMPLATE_KEY_RE.test(key)) return null;
  const [row] = await q
    .select({ meta: templates.meta })
    .from(templates)
    .where(and(eq(templates.key, key), offeredTemplate()))
    .limit(1);
  return row ? resolveTemplateMeta(row.meta, key) : null;
}

/**
 * An offered template's current config and meta with no store involved (the
 * tallaby.com gallery preview). Null for an unknown, hidden or deleted key,
 * or a broken version.
 */
export async function getPublicTemplate(key: string, q: Queryable = db): Promise<{ config: SiteConfig; meta: TemplateMeta } | null> {
  if (typeof key !== "string" || !TEMPLATE_KEY_RE.test(key)) return null;
  const [row] = await q
    .select({ meta: templates.meta, config: templateVersions.config })
    .from(templates)
    .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
    .where(and(eq(templates.key, key), offeredTemplate()))
    .limit(1);
  const config = siteConfigSchema.safeParse(row?.config);
  return row && config.success ? { config: config.data, meta: resolveTemplateMeta(row.meta, key) } : null;
}
