/**
 * Stored templates hold library sections as refs (`libraryRef`, owner
 * 2026-10-25; `@workspace/store-sections` templates/library-ref.ts). Every
 * reader of `template_versions.config` / `templates.draft_config` builds
 * them here, from the library's current published tree, so an admin edit
 * of a library section reaches every template that uses it. A key with no
 * row falls back to the code library design; hidden and soft-deleted rows
 * still count (a template keeps the section it was built with).
 *
 * Platform data only (no seller data). Server-only.
 */
import { and, db, gt, inArray, librarySections } from "@workspace/db";
import { sanitizeSiteConfig, siteConfigSchema, type SiteConfig } from "@workspace/store-sections";
import {
  codeLibraryTree,
  compactTemplateConfig,
  resolveTemplateRefs,
  templateRefKeys,
  type LibraryTreeRow,
  type LibraryTrees,
} from "@workspace/store-sections/templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The published trees of these library keys (one query; empty keys → no query). */
export async function loadLibraryTrees(keys: readonly string[], q: Queryable = db): Promise<LibraryTrees> {
  const trees = new Map<string, LibraryTreeRow>();
  if (!keys.length) return trees;
  const rows = await q
    .select({ key: librarySections.key, category: librarySections.category, tree: librarySections.tree })
    .from(librarySections)
    .where(and(inArray(librarySections.key, [...new Set(keys)]), gt(librarySections.version, 0)));
  for (const row of rows) {
    if (isRecord(row.tree) && row.tree.type === "section") trees.set(row.key, { tree: row.tree as LibraryTreeRow["tree"], category: row.category });
  }
  return trees;
}

const parseRefs = (raw: unknown): SiteConfig | null => {
  const parsed = siteConfigSchema.safeParse(raw);
  return parsed.success && templateRefKeys(parsed.data).length ? parsed.data : null;
};

export type StoredTemplate = { config: unknown; /** `templates.category` (stock photos for slots with no template photo). */ category?: string | null };

/**
 * Stored template configs with their refs built (one library query for all
 * of them). A config with no refs, or one that does not parse, comes back
 * exactly as stored, so the caller's own validation decides as before.
 */
export async function expandTemplateConfigs(stored: readonly StoredTemplate[], q: Queryable = db, opts: { keepRefs?: boolean } = {}): Promise<unknown[]> {
  const parsed = stored.map((s) => parseRefs(s.config));
  const keys = parsed.flatMap((config) => (config ? templateRefKeys(config) : []));
  const trees = await loadLibraryTrees(keys, q);
  return stored.map((s, i) => {
    const config = parsed[i];
    if (!config) return s.config;
    return resolveTemplateRefs(config, trees, { industry: s.category ?? undefined, fallback: codeLibraryTree, keepRefs: opts.keepRefs }).config;
  });
}

/** One stored template config with its refs built (see `expandTemplateConfigs`). */
export async function expandTemplateConfig(config: unknown, category?: string | null, q: Queryable = db, opts: { keepRefs?: boolean } = {}): Promise<unknown> {
  const [expanded] = await expandTemplateConfigs([{ config, category }], q, opts);
  return expanded;
}

/**
 * The storage form of an edited template (Template Studio): sections still
 * exactly as their ref builds them go back to refs, edited ones keep their
 * tree and stop following the library (`compactTemplateConfig`).
 */
export async function compactTemplateForStorage(config: SiteConfig, category?: string | null, q: Queryable = db): Promise<SiteConfig> {
  const keys = templateRefKeys(config);
  if (!keys.length) return config;
  const trees = await loadLibraryTrees(keys, q);
  return compactTemplateConfig(config, trees, { industry: category ?? undefined, fallback: codeLibraryTree, normalize: sanitizeSiteConfig });
}
