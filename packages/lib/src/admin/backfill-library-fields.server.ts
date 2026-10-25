/**
 * One-off: stores the field names (`props.field`, owner 2026-10-26;
 * `@workspace/store-sections` templates/library-fields.ts) in every
 * `library_sections` row, `tree` and `draft_tree`, named like its code
 * design where they still match (`alignFieldNames`). Templates store their
 * values by these names, so they must be fixed before an admin edit can
 * insert nodes ahead of unnamed ones. The names are inert (nothing renders
 * them), so the version is not bumped. Idempotent: a row already named is
 * skipped. `scripts/backfill-library-fields.ts`.
 *
 * Platform data only.
 */
import { asc, db, eq, librarySections } from "@workspace/db";
import type { NodeTemplate } from "@workspace/store-sections/render";
import { alignFieldNames, codeLibraryTree, sameJson } from "@workspace/store-sections/templates";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type LibraryFieldsBackfill = { key: string; result: "named" | "skipped"; reason: string };

const isTree = (value: unknown): value is NodeTemplate =>
  typeof value === "object" && value !== null && !Array.isArray(value) && (value as { type?: unknown }).type === "section";

/** Every row's key (soft-deleted ones too: templates may still point at them). */
export async function listLibraryFieldsBackfillKeys(q: Queryable = db): Promise<string[]> {
  const rows = await q.select({ key: librarySections.key }).from(librarySections).orderBy(asc(librarySections.sortOrder), asc(librarySections.key));
  return rows.map((row) => row.key);
}

export async function backfillLibraryFields(q: Queryable, key: string, opts: { dryRun: boolean }): Promise<LibraryFieldsBackfill> {
  return q.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: librarySections.id, tree: librarySections.tree, draftTree: librarySections.draftTree })
      .from(librarySections)
      .where(eq(librarySections.key, key))
      .for("update");
    if (!row) return { key, result: "skipped", reason: "not found" };
    if (!isTree(row.tree)) return { key, result: "skipped", reason: "tree is not a section" };
    const code = codeLibraryTree(key)?.tree;
    const tree = alignFieldNames(row.tree, code);
    const draftTree = isTree(row.draftTree) ? alignFieldNames(row.draftTree, code) : row.draftTree;
    if (sameJson(tree, row.tree) && sameJson(draftTree, row.draftTree)) return { key, result: "skipped", reason: "already named" };
    if (opts.dryRun) return { key, result: "named", reason: "dry run" };
    await tx.update(librarySections).set({ tree, draftTree }).where(eq(librarySections.id, row.id));
    return { key, result: "named", reason: code ? "named like its code design" : "named (no code design)" };
  });
}
