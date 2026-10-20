/**
 * Admin section library management (spec 2026-10-20-admin-website-builder
 * §5.3, Task 11): list, create (blank or duplicate), save drafts, publish,
 * edit details, hide/show and soft-delete `library_sections` rows (0086).
 *
 * Every write re-checks the actor (`assertAdminActor`: admin / super_admin,
 * never a moderator) inside its transaction; audited writes add one
 * `admin_audit_log` row (target_type 'library_section', seller_id NULL) in
 * that same transaction. Draft saves are not audited. The caller invalidates
 * `invalidateLibrarySections()` after a successful published-state change
 * (this package does not depend on @workspace/cache; templates do the same).
 *
 * A new or duplicated section starts at version 0 ("never published"): the
 * seller palette only lists `version > 0`, so an empty or half-made section
 * never reaches sellers before its first Publish.
 */
import { and, asc, db, eq, ilike, isNull, librarySections, or, sql } from "@workspace/db";
import type { NodeTemplate } from "@workspace/store-sections/render";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import type { AdminAuditAction } from "./admin.lib";
import {
  blankSectionTree,
  libraryKeySchema,
  libraryReason,
  librarySectionCreateSchema,
  librarySectionMetaSchema,
  prepareLibraryTree,
} from "./library-sections-admin.lib";

export {
  blankSectionTree,
  libraryReason,
  librarySectionCreateSchema,
  librarySectionMetaSchema,
  prepareLibraryTree,
  type LibrarySectionCreateInput,
  type LibrarySectionMetaInput,
} from "./library-sections-admin.lib";

export type LibrarySectionAdminError =
  | "not_admin"
  | "invalid_input"
  | "invalid_reason"
  | "key_taken"
  | "not_found"
  | "version_conflict"
  | "invalid_tree"
  | "no_change";

export type LibraryAdminResult<T> = { success: true; data: T } | { success: false; error: LibrarySectionAdminError };

const TARGET_TYPE = "library_section";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class Outcome extends Error {
  constructor(readonly error: LibrarySectionAdminError) {
    super(error);
  }
}

const isUniqueViolation = (error: unknown) => {
  const code = (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
};

/** Runs `run` in a transaction after the actor check; maps the known failures to error codes. */
async function adminWrite<T>(q: Queryable, actorId: string, run: (tx: Queryable) => Promise<T>): Promise<LibraryAdminResult<T>> {
  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      return run(tx);
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof Outcome) return { success: false, error: error.error };
    if (isUniqueViolation(error)) return { success: false, error: "key_taken" };
    throw error;
  }
}

async function audit(
  tx: Queryable,
  entry: { actorId: string; key: string; action: AdminAuditAction; before: Record<string, unknown>; after: Record<string, unknown>; reason: string },
) {
  await writeAdminAudit(tx, {
    actorId: entry.actorId,
    sellerId: null,
    targetType: TARGET_TYPE,
    targetId: entry.key,
    action: entry.action,
    before: entry.before,
    after: entry.after,
    reason: entry.reason,
  });
}

/** The live (not deleted) row, locked for the rest of the transaction. */
async function lockRow(tx: Queryable, id: string) {
  if (!UUID_RE.test(id)) throw new Outcome("not_found");
  const [row] = await tx
    .select()
    .from(librarySections)
    .where(and(eq(librarySections.id, id), isNull(librarySections.deletedAt)))
    .for("update");
  if (!row) throw new Outcome("not_found");
  return row;
}

function reasonOrThrow(reason: unknown): string {
  const why = libraryReason(reason);
  if (!why) throw new Outcome("invalid_reason");
  return why;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type LibrarySectionAdminRow = {
  id: string;
  key: string;
  category: string;
  subcategory: string;
  name: unknown;
  description: unknown;
  keywords: string[];
  version: number;
  draftVersion: number;
  hasDraft: boolean;
  isHidden: boolean;
  sortOrder: number;
  updatedAt: string;
};

/** Every non-deleted section (hidden ones only with `includeHidden`), in palette order. */
export async function listLibrarySectionsForAdmin(
  filter: { category?: string; includeHidden: boolean; query?: string },
  q: Queryable = db,
): Promise<LibrarySectionAdminRow[]> {
  const conditions = [isNull(librarySections.deletedAt)];
  if (!filter.includeHidden) conditions.push(eq(librarySections.isHidden, false));
  if (filter.category) conditions.push(eq(librarySections.category, filter.category));
  const text = filter.query?.trim().slice(0, 100);
  if (text) {
    const pattern = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        ilike(librarySections.key, pattern),
        ilike(sql`${librarySections.name}->>'en'`, pattern),
        ilike(sql`${librarySections.name}->>'ar'`, pattern),
      )!,
    );
  }
  return q
    .select({
      id: librarySections.id,
      key: librarySections.key,
      category: librarySections.category,
      subcategory: librarySections.subcategory,
      name: librarySections.name,
      description: librarySections.description,
      keywords: librarySections.keywords,
      version: librarySections.version,
      draftVersion: librarySections.draftVersion,
      hasDraft: sql<boolean>`${librarySections.draftTree} IS NOT NULL`,
      isHidden: librarySections.isHidden,
      sortOrder: librarySections.sortOrder,
      updatedAt: librarySections.updatedAt,
    })
    .from(librarySections)
    .where(and(...conditions))
    .orderBy(asc(librarySections.sortOrder), asc(librarySections.key));
}

export type LibrarySectionForEditor = {
  id: string;
  key: string;
  category: string;
  name: unknown;
  /** What the editor opens: the draft when there is one, else the published tree. */
  tree: NodeTemplate;
  draftVersion: number;
  version: number;
  hasDraft: boolean;
};

/** One non-deleted section for the section editor, or null. */
export async function getLibrarySectionForEditor(id: string, q: Queryable = db): Promise<LibrarySectionForEditor | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await q
    .select()
    .from(librarySections)
    .where(and(eq(librarySections.id, id), isNull(librarySections.deletedAt)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    key: row.key,
    category: row.category,
    name: row.name,
    tree: (row.draftTree ?? row.tree) as NodeTemplate,
    draftVersion: row.draftVersion,
    version: row.version,
    hasDraft: row.draftTree !== null,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** A new section from a blank `section` root, unpublished (version 0). Audited: create_library_section. */
export async function createLibrarySection(
  actorId: string,
  input: unknown,
  reason: unknown,
  q: Queryable = db,
): Promise<LibraryAdminResult<{ id: string; key: string }>> {
  const parsed = librarySectionCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  const { key, category, subcategory, name, description } = parsed.data;
  const tree = blankSectionTree();
  return adminWrite(q, actorId, async (tx) => {
    const [row] = await tx
      .insert(librarySections)
      .values({ key, category, subcategory, name, description, tree, draftTree: tree, version: 0, createdBy: actorId, updatedBy: actorId })
      .onConflictDoNothing({ target: librarySections.key })
      .returning({ id: librarySections.id, key: librarySections.key });
    if (!row) throw new Outcome("key_taken");
    await audit(tx, { actorId, key, action: "create_library_section", before: {}, after: { id: row.id, key, category, subcategory, name }, reason: why });
    return row;
  });
}

/**
 * A copy of a section under `newKey`: its published tree and its pending
 * draft (or the published tree), unpublished and visible to admins only until
 * published. Audited as create_library_section with after.duplicatedFrom.
 */
export async function duplicateLibrarySection(
  actorId: string,
  id: string,
  newKey: unknown,
  reason: unknown,
  q: Queryable = db,
): Promise<LibraryAdminResult<{ id: string; key: string }>> {
  const key = libraryKeySchema.safeParse(newKey);
  if (!key.success) return { success: false, error: "invalid_input" };
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const source = await lockRow(tx, String(id));
    const [row] = await tx
      .insert(librarySections)
      .values({
        key: key.data,
        category: source.category,
        subcategory: source.subcategory,
        name: source.name,
        description: source.description,
        keywords: source.keywords,
        tree: source.tree,
        draftTree: source.draftTree ?? source.tree,
        version: 0,
        thumbnailUrl: source.thumbnailUrl,
        sortOrder: source.sortOrder,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .onConflictDoNothing({ target: librarySections.key })
      .returning({ id: librarySections.id, key: librarySections.key });
    if (!row) throw new Outcome("key_taken");
    await audit(tx, {
      actorId,
      key: row.key,
      action: "create_library_section",
      before: {},
      after: { id: row.id, key: row.key, duplicatedFrom: source.key },
      reason: why,
    });
    return row;
  });
}

/**
 * Autosave of the section editor: the tree must be one valid `section` root
 * (checked as a custom-section); optimistic on `draft_version`. Not audited,
 * and it changes nothing sellers see.
 */
export async function saveLibrarySectionDraft(
  actorId: string,
  id: string,
  tree: unknown,
  clientVersion: number,
  q: Queryable = db,
): Promise<LibraryAdminResult<{ draftVersion: number }>> {
  const prepared = prepareLibraryTree(tree);
  if (!prepared.ok) return { success: false, error: "invalid_tree" };
  if (!Number.isInteger(clientVersion)) return { success: false, error: "invalid_input" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockRow(tx, String(id));
    if (row.draftVersion !== clientVersion) throw new Outcome("version_conflict");
    const [updated] = await tx
      .update(librarySections)
      .set({ draftTree: prepared.tree, draftVersion: sql`${librarySections.draftVersion} + 1`, updatedBy: actorId, updatedAt: sql`now()` })
      .where(and(eq(librarySections.id, row.id), eq(librarySections.draftVersion, clientVersion)))
      .returning({ draftVersion: librarySections.draftVersion });
    if (!updated) throw new Outcome("version_conflict");
    return { draftVersion: updated.draftVersion };
  });
}

/** Publish: `tree = draft_tree`, `draft_tree = null`, `version + 1`. Audited: publish_library_section. */
export async function publishLibrarySection(
  actorId: string,
  id: string,
  reason: unknown,
  q: Queryable = db,
): Promise<LibraryAdminResult<{ version: number }>> {
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockRow(tx, String(id));
    // A never-published section can be published as it is; otherwise there must be a draft.
    if (row.draftTree === null && row.version > 0) throw new Outcome("no_change");
    const prepared = prepareLibraryTree(row.draftTree ?? row.tree);
    if (!prepared.ok) throw new Outcome("invalid_tree");
    const version = row.version + 1;
    await tx
      .update(librarySections)
      .set({ tree: prepared.tree, draftTree: null, version, updatedBy: actorId, updatedAt: sql`now()` })
      .where(eq(librarySections.id, row.id));
    await audit(tx, { actorId, key: row.key, action: "publish_library_section", before: { version: row.version }, after: { version }, reason: why });
    return { version };
  });
}

/** Name, description, category, subcategory, keywords and order. Audited: update_library_section. */
export async function updateLibrarySectionMeta(
  actorId: string,
  id: string,
  input: unknown,
  reason: unknown,
  q: Queryable = db,
): Promise<LibraryAdminResult<null>> {
  const parsed = librarySectionMetaSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockRow(tx, String(id));
    const before = {
      category: row.category,
      subcategory: row.subcategory,
      name: row.name,
      description: row.description,
      keywords: row.keywords,
      sortOrder: row.sortOrder,
    };
    const after = {
      category: parsed.data.category,
      subcategory: parsed.data.subcategory,
      name: parsed.data.name,
      description: parsed.data.description,
      keywords: parsed.data.keywords ?? row.keywords,
      sortOrder: parsed.data.sortOrder ?? row.sortOrder,
    };
    if (JSON.stringify(before) === JSON.stringify(after)) throw new Outcome("no_change");
    await tx.update(librarySections).set({ ...after, updatedBy: actorId, updatedAt: sql`now()` }).where(eq(librarySections.id, row.id));
    await audit(tx, { actorId, key: row.key, action: "update_library_section", before, after, reason: why });
    return null;
  });
}

/** Hides or shows a section in the seller palette. Audited: hide_library_section (both directions). */
export async function setLibrarySectionHidden(
  actorId: string,
  id: string,
  hidden: boolean,
  reason: unknown,
  q: Queryable = db,
): Promise<LibraryAdminResult<null>> {
  if (typeof hidden !== "boolean") return { success: false, error: "invalid_input" };
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockRow(tx, String(id));
    if (row.isHidden === hidden) throw new Outcome("no_change");
    await tx.update(librarySections).set({ isHidden: hidden, updatedBy: actorId, updatedAt: sql`now()` }).where(eq(librarySections.id, row.id));
    await audit(tx, { actorId, key: row.key, action: "hide_library_section", before: { isHidden: row.isHidden }, after: { isHidden: hidden }, reason: why });
    return null;
  });
}

/** Soft delete (`deleted_at`). Stores hold copies, so nothing that uses it breaks. Audited: delete_library_section. */
export async function deleteLibrarySection(actorId: string, id: string, reason: unknown, q: Queryable = db): Promise<LibraryAdminResult<null>> {
  const why = libraryReason(reason);
  if (!why) return { success: false, error: "invalid_reason" };
  return adminWrite(q, actorId, async (tx) => {
    const row = await lockRow(tx, String(id));
    await tx.update(librarySections).set({ deletedAt: sql`now()`, updatedBy: actorId, updatedAt: sql`now()` }).where(eq(librarySections.id, row.id));
    await audit(tx, { actorId, key: row.key, action: "delete_library_section", before: { deletedAt: null }, after: { deleted: true }, reason: why });
    return null;
  });
}
