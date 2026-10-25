/**
 * One-off conversion of stored templates to library refs (owner,
 * 2026-10-25; named fields 2026-10-26; `scripts/backfill-template-refs.ts`):
 * each template's current version gets a new version in which every section
 * that is still an exact copy of its seed (what its ref builds from the code
 * library, after the sanitizer) is a ref: the library key plus the
 * template's values per named field, so it follows later library edits.
 * Classic and Atelier designs become refs to their own hidden library rows
 * (0105). Sections an admin edited keep their trees. A ref in the earlier
 * `patch` form is rebuilt and converted too.
 *
 * Skips a template with an admin draft (the Studio would publish over it),
 * a soft-deleted one, one whose current version does not parse, and one
 * with nothing to convert, so it is idempotent. Verifies before writing that
 * the new version, built from the code library, equals the old one.
 *
 * Platform data only. Callers invalidate `templateTags.catalog()` after.
 */
import { and, asc, db, eq, isNull, max, templateVersions, templates } from "@workspace/db";
import { CURRENT_SITE_CONFIG_VERSION, sanitizeSiteConfig, siteConfigSchema, type SiteConfig } from "@workspace/store-sections";
import { codeLibraryTree, hasPatchRefs, resolveTemplateRefs, sameJson, storedTemplateRefConfig } from "@workspace/store-sections/templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export const TEMPLATE_REFS_CHANGELOG = "library sections as named-field refs";

export type TemplateRefsBackfill = {
  key: string;
  result: "converted" | "skipped";
  reason: string;
  /** Sections that are refs in the new version (converted only). */
  refs?: number;
  sections?: number;
  bytesBefore?: number;
  bytesAfter?: number;
  version?: number;
};

const sectionsOf = (config: SiteConfig) => [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s) => s !== null);
const countRefs = (config: SiteConfig) => sectionsOf(config).filter((s) => s.libraryRef).length;

/** The keys of every non-deleted template, in gallery order. */
export async function listTemplateRefsBackfillKeys(q: Queryable = db): Promise<string[]> {
  const rows = await q.select({ key: templates.key }).from(templates).where(isNull(templates.deletedAt)).orderBy(asc(templates.sortOrder), asc(templates.key));
  return rows.map((row) => row.key);
}

export async function backfillTemplateRefs(q: Queryable, key: string, opts: { dryRun: boolean }): Promise<TemplateRefsBackfill> {
  return q.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: templates.id, category: templates.category, draftConfig: templates.draftConfig, currentVersionId: templates.currentVersionId })
      .from(templates)
      .where(and(eq(templates.key, key), isNull(templates.deletedAt)))
      .for("update");
    if (!row) return { key, result: "skipped", reason: "not found or deleted" };
    if (row.draftConfig !== null) return { key, result: "skipped", reason: "has an admin draft (publish or discard it first)" };
    if (!row.currentVersionId) return { key, result: "skipped", reason: "no current version" };
    const [current] = await tx.select({ config: templateVersions.config }).from(templateVersions).where(eq(templateVersions.id, row.currentVersionId));
    const parsed = siteConfigSchema.safeParse(current?.config);
    if (!parsed.success) return { key, result: "skipped", reason: "current version does not parse" };

    const before = parsed.data;
    const after = storedTemplateRefConfig(before, { industry: row.category, normalize: sanitizeSiteConfig });
    const refs = countRefs(after);
    if (refs === countRefs(before) && !hasPatchRefs(before)) return { key, result: "skipped", reason: "nothing to convert" };

    // Built from the code library (what the seeds were made from), the new version must give the old one exactly.
    const built = (config: SiteConfig) => sanitizeSiteConfig(resolveTemplateRefs(config, new Map(), { industry: row.category, fallback: codeLibraryTree }).config);
    if (!sameJson(built(after), built(before))) return { key, result: "skipped", reason: "verification failed (left as it is)" };

    const stats = { refs, sections: sectionsOf(after).length, bytesBefore: JSON.stringify(before).length, bytesAfter: JSON.stringify(after).length };
    if (opts.dryRun) return { key, result: "converted", reason: "dry run", ...stats };

    const [top] = await tx.select({ top: max(templateVersions.version) }).from(templateVersions).where(eq(templateVersions.templateId, row.id));
    const version = (top?.top ?? 0) + 1;
    const [inserted] = await tx
      .insert(templateVersions)
      .values({ templateId: row.id, version, schemaVersion: CURRENT_SITE_CONFIG_VERSION, config: after, changelog: TEMPLATE_REFS_CHANGELOG })
      .returning({ id: templateVersions.id });
    await tx.update(templates).set({ currentVersionId: inserted!.id, updatedAt: new Date().toISOString() }).where(eq(templates.id, row.id));
    return { key, result: "converted", reason: `version ${version}`, version, ...stats };
  });
}
