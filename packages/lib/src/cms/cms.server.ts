/**
 * Server-only CMS + blog storage (PLAN.md §8.5 P4-11, §8.9 P4-16, §11.7).
 *
 * Seller-side functions take the session's sellerId and an explicit storeId,
 * check that the store is the seller's (and not deleted) before anything
 * else, and filter every child row by store_id. The cms_items_same_store
 * trigger (0055) is the backstop for item ↔ collection.
 *
 * Public functions take only the storeId that the storefront resolved from the
 * request host, and return published items whose published_at is due —
 * never drafts or scheduled items. Callers cache them per seller + store
 * (`storeTags.cms`), never the seller-side reads.
 *
 * Rich text is sanitized here on save (sanitizeArticleHtml) and again by the
 * storefront before render.
 */
import {
  and,
  asc,
  cmsCollections,
  cmsItemRevisions,
  cmsItems,
  count,
  db,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  stores,
} from "@workspace/db";
import { articlePlainText, sanitizeArticleHtml } from "@workspace/store-sections/config";
import {
  BLOG_COLLECTION_SLUG,
  BLOG_FIELDS,
  CMS_MAX_COLLECTIONS,
  type CmsDataIssue,
  type CmsFieldDef,
  type CmsItemState,
  type CmsSeo,
  type PublicCmsItem,
  cmsCollectionInputSchema,
  cmsFieldsSchema,
  cmsItemInputSchema,
  cmsItemPath,
  cmsItemState,
  cmsSeoSchema,
  parseCmsItemData,
  primaryFieldKey,
  readingMinutes,
} from "./cms.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Revisions kept per item (older ones are pruned on save). */
const MAX_REVISIONS = 30;

export type CmsError =
  | "not_found"
  | "store_read_only"
  | "invalid_input"
  | "slug_taken"
  | "reserved_slug"
  | "limit_reached"
  | "system_collection"
  | "invalid_data";

export type CmsResult<T> = { success: true; data: T } | { success: false; error: CmsError; issues?: CmsDataIssue[] };

class CmsActionError extends Error {
  constructor(
    readonly code: CmsError,
    readonly issues?: CmsDataIssue[],
  ) {
    super(code);
  }
}

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

function fail<T>(error: unknown): CmsResult<T> {
  if (error instanceof CmsActionError) return { success: false, error: error.code, ...(error.issues && { issues: error.issues }) };
  if (pgErrorCode(error) === "23505") return { success: false, error: "slug_taken" };
  throw error;
}

const ownStore = (sellerId: string, storeId: string) =>
  and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt));

/** The seller's store, or a CmsActionError. Writes need an active store. */
async function requireOwnStore(q: Queryable, sellerId: string, storeId: string, forWrite: boolean) {
  if (!UUID_RE.test(storeId)) throw new CmsActionError("not_found");
  const [store] = await q.select({ id: stores.id, status: stores.status }).from(stores).where(ownStore(sellerId, storeId)).limit(1);
  if (!store) throw new CmsActionError("not_found");
  if (forWrite && store.status !== "active") throw new CmsActionError("store_read_only");
  return store;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export type CmsCollectionRow = {
  id: string;
  kind: string;
  name: string;
  slug: string;
  description: string | null;
  fields: CmsFieldDef[];
  isSystem: boolean;
  itemCount: number;
  updatedAt: string;
};

/** The fields that govern a collection: fixed for the blog, stored for the rest. */
export function collectionFields(collection: { kind: string; fields: unknown }): CmsFieldDef[] {
  if (collection.kind === "blog") return [...BLOG_FIELDS];
  const parsed = cmsFieldsSchema.safeParse(collection.fields);
  return parsed.success ? parsed.data : [];
}

const collectionColumns = {
  id: cmsCollections.id,
  kind: cmsCollections.kind,
  name: cmsCollections.name,
  slug: cmsCollections.slug,
  description: cmsCollections.description,
  fields: cmsCollections.fields,
  isSystem: cmsCollections.isSystem,
  updatedAt: cmsCollections.updatedAt,
};

function toCollection(row: { fields: unknown; kind: string } & Omit<CmsCollectionRow, "fields" | "itemCount">, itemCount = 0): CmsCollectionRow {
  return { ...row, fields: collectionFields(row), itemCount };
}

/** The store's collections with item counts (the blog first). Null for a foreign store. */
export async function listCmsCollections(sellerId: string, storeId: string, q: Queryable = db): Promise<CmsCollectionRow[] | null> {
  try {
    await requireOwnStore(q, sellerId, storeId, false);
  } catch {
    return null;
  }
  const rows = await q
    .select({
      ...collectionColumns,
      itemCount: sql<number>`(SELECT count(*)::int FROM ${cmsItems} i WHERE i.collection_id = ${cmsCollections.id} AND i.store_id = ${storeId})`,
    })
    .from(cmsCollections)
    .where(eq(cmsCollections.storeId, storeId))
    .orderBy(desc(cmsCollections.isSystem), asc(cmsCollections.name));
  return rows.map(({ itemCount, ...row }) => toCollection(row, Number(itemCount)));
}

export async function getCmsCollection(sellerId: string, storeId: string, collectionId: string, q: Queryable = db): Promise<CmsCollectionRow | null> {
  if (!UUID_RE.test(collectionId)) return null;
  try {
    await requireOwnStore(q, sellerId, storeId, false);
  } catch {
    return null;
  }
  const [row] = await q
    .select(collectionColumns)
    .from(cmsCollections)
    .where(and(eq(cmsCollections.id, collectionId), eq(cmsCollections.storeId, storeId)))
    .limit(1);
  return row ? toCollection(row) : null;
}

/**
 * The store's system `blog` collection, created on first use (idempotent:
 * concurrent callers converge on the same row).
 */
export async function ensureBlogCollection(sellerId: string, storeId: string, q: Queryable = db): Promise<CmsResult<CmsCollectionRow>> {
  try {
    await requireOwnStore(q, sellerId, storeId, false);
    await q
      .insert(cmsCollections)
      .values({
        storeId,
        kind: "blog",
        name: "Blog",
        slug: BLOG_COLLECTION_SLUG,
        fields: [],
        primaryFieldKey: "title",
        slugFieldKey: "title",
        isSystem: true,
      })
      .onConflictDoNothing({ target: [cmsCollections.storeId, cmsCollections.slug] });
    const [row] = await q
      .select(collectionColumns)
      .from(cmsCollections)
      .where(and(eq(cmsCollections.storeId, storeId), eq(cmsCollections.slug, BLOG_COLLECTION_SLUG)))
      .limit(1);
    if (!row || row.kind !== "blog") throw new CmsActionError("not_found");
    return { success: true, data: toCollection(row) };
  } catch (error) {
    return fail(error);
  }
}

export async function createCmsCollection(sellerId: string, storeId: string, input: unknown, q: Queryable = db): Promise<CmsResult<{ id: string }>> {
  const parsed = cmsCollectionInputSchema.safeParse(input);
  if (!parsed.success) {
    const reserved = parsed.error.issues.some((i) => i.message === "reserved_slug");
    return { success: false, error: reserved ? "reserved_slug" : "invalid_input" };
  }
  const { name, slug, description, fields } = parsed.data;
  try {
    const id = await q.transaction(async (tx) => {
      const [store] = await tx.select({ id: stores.id, status: stores.status }).from(stores).where(ownStore(sellerId, storeId)).for("update");
      if (!store) throw new CmsActionError("not_found");
      if (store.status !== "active") throw new CmsActionError("store_read_only");
      const [{ n } = { n: 0 }] = await tx
        .select({ n: count() })
        .from(cmsCollections)
        .where(and(eq(cmsCollections.storeId, storeId), eq(cmsCollections.isSystem, false)));
      if (Number(n) >= CMS_MAX_COLLECTIONS) throw new CmsActionError("limit_reached");
      const [row] = await tx
        .insert(cmsCollections)
        .values({ storeId, kind: "custom", name, slug, description, fields, primaryFieldKey: primaryFieldKey(fields) })
        .returning({ id: cmsCollections.id });
      return row!.id;
    });
    return { success: true, data: { id } };
  } catch (error) {
    return fail(error);
  }
}

/** Renames a collection, changes its slug (public URLs move) or its fields. The blog is fixed. */
export async function updateCmsCollection(
  sellerId: string,
  storeId: string,
  collectionId: string,
  input: unknown,
  q: Queryable = db,
): Promise<CmsResult<{ id: string }>> {
  const parsed = cmsCollectionInputSchema.safeParse(input);
  if (!parsed.success) {
    const reserved = parsed.error.issues.some((i) => i.message === "reserved_slug");
    return { success: false, error: reserved ? "reserved_slug" : "invalid_input" };
  }
  if (!UUID_RE.test(collectionId)) return { success: false, error: "not_found" };
  const { name, slug, description, fields } = parsed.data;
  try {
    await requireOwnStore(q, sellerId, storeId, true);
    const [existing] = await q
      .select({ isSystem: cmsCollections.isSystem })
      .from(cmsCollections)
      .where(and(eq(cmsCollections.id, collectionId), eq(cmsCollections.storeId, storeId)))
      .limit(1);
    if (!existing) throw new CmsActionError("not_found");
    if (existing.isSystem) throw new CmsActionError("system_collection");
    await q
      .update(cmsCollections)
      .set({ name, slug, description, fields, primaryFieldKey: primaryFieldKey(fields), updatedAt: sql`now()` })
      .where(and(eq(cmsCollections.id, collectionId), eq(cmsCollections.storeId, storeId)));
    return { success: true, data: { id: collectionId } };
  } catch (error) {
    return fail(error);
  }
}

/** Deletes a collection and its items (cascade). The blog cannot be deleted. */
export async function deleteCmsCollection(sellerId: string, storeId: string, collectionId: string, q: Queryable = db): Promise<CmsResult<null>> {
  if (!UUID_RE.test(collectionId)) return { success: false, error: "not_found" };
  try {
    await requireOwnStore(q, sellerId, storeId, true);
    const [existing] = await q
      .select({ isSystem: cmsCollections.isSystem })
      .from(cmsCollections)
      .where(and(eq(cmsCollections.id, collectionId), eq(cmsCollections.storeId, storeId)))
      .limit(1);
    if (!existing) throw new CmsActionError("not_found");
    if (existing.isSystem) throw new CmsActionError("system_collection");
    await q.delete(cmsCollections).where(and(eq(cmsCollections.id, collectionId), eq(cmsCollections.storeId, storeId)));
    return { success: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Items (seller side)
// ---------------------------------------------------------------------------

export type CmsItemRow = {
  id: string;
  collectionId: string;
  slug: string;
  status: string;
  state: CmsItemState;
  data: Record<string, unknown>;
  seo: CmsSeo;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const itemColumns = {
  id: cmsItems.id,
  collectionId: cmsItems.collectionId,
  slug: cmsItems.slug,
  status: cmsItems.status,
  data: cmsItems.data,
  seo: cmsItems.seo,
  publishedAt: cmsItems.publishedAt,
  createdAt: cmsItems.createdAt,
  updatedAt: cmsItems.updatedAt,
};

type RawItem = { [K in keyof typeof itemColumns]: unknown };

function toItem(row: RawItem, now = new Date()): CmsItemRow {
  const seo = cmsSeoSchema.safeParse(row.seo ?? {});
  return {
    id: row.id as string,
    collectionId: row.collectionId as string,
    slug: row.slug as string,
    status: row.status as string,
    state: cmsItemState(row.status as string, row.publishedAt as string | null, now),
    data: (row.data ?? {}) as Record<string, unknown>,
    seo: seo.success ? seo.data : { title: "", description: "", ogImage: "", noindex: false },
    publishedAt: (row.publishedAt as string | null) ?? null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export type CmsItemFilters = {
  state?: CmsItemState | "all";
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

function stateFilter(state: CmsItemFilters["state"]) {
  switch (state) {
    case "draft":
      return or(sql`${cmsItems.status} <> 'published'`, isNull(cmsItems.publishedAt));
    case "scheduled":
      return and(eq(cmsItems.status, "published"), sql`${cmsItems.publishedAt} > now()`);
    case "published":
      return and(eq(cmsItems.status, "published"), sql`${cmsItems.publishedAt} <= now()`);
    default:
      return undefined;
  }
}

/** A collection's items for the dashboard (drafts included), newest first. Null for a foreign store/collection. */
export async function listCmsItems(
  sellerId: string,
  storeId: string,
  collectionId: string,
  filters: CmsItemFilters = {},
  q: Queryable = db,
): Promise<{ items: CmsItemRow[]; total: number } | null> {
  const collection = await getCmsCollection(sellerId, storeId, collectionId, q);
  if (!collection) return null;
  const titleKey = primaryFieldKey(collection.fields) ?? "title";
  const search = filters.search?.trim().slice(0, 80);
  const tag = filters.tag?.trim().toLowerCase().slice(0, 40);
  const where = and(
    eq(cmsItems.storeId, storeId),
    eq(cmsItems.collectionId, collectionId),
    stateFilter(filters.state),
    tag ? sql`${cmsItems.data} -> 'tags' ? ${tag}` : undefined,
    search
      ? or(ilike(cmsItems.slug, `%${search.replace(/[%_\\]/g, "\\$&")}%`), sql`${cmsItems.data} ->> ${titleKey} ILIKE ${`%${search.replace(/[%_\\]/g, "\\$&")}%`}`)
      : undefined,
  );
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const [rows, [{ n } = { n: 0 }]] = await Promise.all([
    q
      .select(itemColumns)
      .from(cmsItems)
      .where(where)
      .orderBy(desc(sql`coalesce(${cmsItems.publishedAt}, ${cmsItems.updatedAt})`), desc(cmsItems.createdAt))
      .limit(limit)
      .offset(Math.max(filters.offset ?? 0, 0)),
    q.select({ n: count() }).from(cmsItems).where(where),
  ]);
  const now = new Date();
  return { items: rows.map((row) => toItem(row, now)), total: Number(n) };
}

/** One item with its collection, for the editor. Null unless both belong to the seller's store. */
export async function getCmsItem(
  sellerId: string,
  storeId: string,
  itemId: string,
  q: Queryable = db,
): Promise<{ item: CmsItemRow; collection: CmsCollectionRow } | null> {
  if (!UUID_RE.test(itemId)) return null;
  try {
    await requireOwnStore(q, sellerId, storeId, false);
  } catch {
    return null;
  }
  const [row] = await q
    .select(itemColumns)
    .from(cmsItems)
    .where(and(eq(cmsItems.id, itemId), eq(cmsItems.storeId, storeId)))
    .limit(1);
  if (!row) return null;
  const collection = await getCmsCollection(sellerId, storeId, row.collectionId, q);
  if (!collection) return null;
  return { item: toItem(row), collection };
}

/** Item data validated against the collection, rich text sanitized, blog extras derived. */
function prepareData(collection: { kind: string; fields: CmsFieldDef[] }, raw: Record<string, unknown>) {
  const parsed = parseCmsItemData(collection.fields, raw);
  if (!parsed.success) throw new CmsActionError("invalid_data", parsed.issues);
  const data = parsed.data;
  for (const field of collection.fields) {
    if (field.type === "richtext" && typeof data[field.key] === "string") {
      const clean = sanitizeArticleHtml(data[field.key] as string);
      if (articlePlainText(clean) || /<img\b/i.test(clean)) data[field.key] = clean;
      else delete data[field.key];
    }
  }
  if (collection.kind === "blog") {
    data.readingMinutes = readingMinutes(articlePlainText(typeof data.body === "string" ? data.body : ""));
  }
  return data;
}

/**
 * Creates (itemId = null) or updates an item and records a revision of what
 * was saved. Publishing is per item: status 'published' with no date goes live
 * now, a future `publishedAt` schedules it; no site publish is involved.
 */
export async function saveCmsItem(
  sellerId: string,
  storeId: string,
  collectionId: string,
  itemId: string | null,
  input: unknown,
  userId: string | null,
  q: Queryable = db,
): Promise<CmsResult<{ id: string; slug: string; state: CmsItemState; publishedAt: string | null }>> {
  const parsed = cmsItemInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  if (!UUID_RE.test(collectionId) || (itemId !== null && !UUID_RE.test(itemId))) return { success: false, error: "not_found" };
  const { slug, status, publishedAt: requestedAt } = parsed.data;
  const seo = cmsSeoSchema.parse(parsed.data.seo ?? {});

  try {
    const saved = await q.transaction(async (tx) => {
      await requireOwnStore(tx, sellerId, storeId, true);
      const [collectionRow] = await tx
        .select({ kind: cmsCollections.kind, fields: cmsCollections.fields })
        .from(cmsCollections)
        .where(and(eq(cmsCollections.id, collectionId), eq(cmsCollections.storeId, storeId)))
        .limit(1);
      if (!collectionRow) throw new CmsActionError("not_found");
      const data = prepareData({ kind: collectionRow.kind, fields: collectionFields(collectionRow) }, parsed.data.data);

      let current: { publishedAt: string | null } | undefined;
      if (itemId) {
        [current] = await tx
          .select({ publishedAt: cmsItems.publishedAt })
          .from(cmsItems)
          .where(and(eq(cmsItems.id, itemId), eq(cmsItems.storeId, storeId), eq(cmsItems.collectionId, collectionId)))
          .for("update");
        if (!current) throw new CmsActionError("not_found");
      }
      // An item keeps its first publish date unless the seller sets one; a
      // draft is never public whatever its date (status decides).
      const publishedAt = requestedAt
        ? new Date(requestedAt).toISOString()
        : (current?.publishedAt ?? (status === "published" ? new Date().toISOString() : null));

      const values = { slug, status, data, seo, publishedAt, updatedAt: sql`now()` };
      const [row] = itemId
        ? await tx
            .update(cmsItems)
            .set(values)
            .where(and(eq(cmsItems.id, itemId), eq(cmsItems.storeId, storeId), eq(cmsItems.collectionId, collectionId)))
            .returning({ id: cmsItems.id, publishedAt: cmsItems.publishedAt })
        : await tx
            .insert(cmsItems)
            .values({ ...values, collectionId, storeId, createdBy: userId })
            .returning({ id: cmsItems.id, publishedAt: cmsItems.publishedAt });
      if (!row) throw new CmsActionError("not_found");

      await tx.insert(cmsItemRevisions).values({
        itemId: row.id,
        data: { slug, status, publishedAt, data, seo },
        reason: itemId ? "manual" : "create",
        createdBy: userId,
      });
      await tx.execute(sql`
        DELETE FROM cms_item_revisions
        WHERE item_id = ${row.id}
          AND id NOT IN (SELECT id FROM cms_item_revisions WHERE item_id = ${row.id} ORDER BY created_at DESC LIMIT ${MAX_REVISIONS})
      `);
      return { id: row.id, publishedAt: row.publishedAt };
    });
    return { success: true, data: { id: saved.id, slug, state: cmsItemState(status, saved.publishedAt), publishedAt: saved.publishedAt } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCmsItem(sellerId: string, storeId: string, itemId: string, q: Queryable = db): Promise<CmsResult<null>> {
  if (!UUID_RE.test(itemId)) return { success: false, error: "not_found" };
  try {
    await requireOwnStore(q, sellerId, storeId, true);
    const deleted = await q
      .delete(cmsItems)
      .where(and(eq(cmsItems.id, itemId), eq(cmsItems.storeId, storeId)))
      .returning({ id: cmsItems.id });
    if (!deleted.length) throw new CmsActionError("not_found");
    return { success: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export type CmsRevisionRow = { id: string; reason: string; createdAt: string; slug: string; status: string; title: string };

/** Saved versions of an item, newest first. Null for an item outside the seller's store. */
export async function listCmsItemRevisions(sellerId: string, storeId: string, itemId: string, q: Queryable = db): Promise<CmsRevisionRow[] | null> {
  const found = await getCmsItem(sellerId, storeId, itemId, q);
  if (!found) return null;
  const titleKey = primaryFieldKey(found.collection.fields) ?? "title";
  const rows = await q
    .select({ id: cmsItemRevisions.id, reason: cmsItemRevisions.reason, createdAt: cmsItemRevisions.createdAt, data: cmsItemRevisions.data })
    .from(cmsItemRevisions)
    .where(eq(cmsItemRevisions.itemId, itemId))
    .orderBy(desc(cmsItemRevisions.createdAt))
    .limit(MAX_REVISIONS);
  return rows.map((row) => {
    const snapshot = (row.data ?? {}) as { slug?: string; status?: string; data?: Record<string, unknown> };
    const title = snapshot.data?.[titleKey];
    return {
      id: row.id,
      reason: row.reason,
      createdAt: row.createdAt,
      slug: snapshot.slug ?? "",
      status: snapshot.status ?? "draft",
      title: typeof title === "string" ? title : "",
    };
  });
}

/**
 * Brings back the content (data, SEO, slug) of a saved version. The item's
 * current status and date are kept, so restoring never publishes by itself.
 */
export async function restoreCmsItemRevision(
  sellerId: string,
  storeId: string,
  itemId: string,
  revisionId: string,
  userId: string | null,
  q: Queryable = db,
): Promise<CmsResult<{ id: string; slug: string; state: CmsItemState; publishedAt: string | null }>> {
  if (!UUID_RE.test(revisionId)) return { success: false, error: "not_found" };
  const found = await getCmsItem(sellerId, storeId, itemId, q);
  if (!found) return { success: false, error: "not_found" };
  const [revision] = await q
    .select({ data: cmsItemRevisions.data })
    .from(cmsItemRevisions)
    .where(and(eq(cmsItemRevisions.id, revisionId), eq(cmsItemRevisions.itemId, itemId)))
    .limit(1);
  if (!revision) return { success: false, error: "not_found" };
  const snapshot = (revision.data ?? {}) as { slug?: string; data?: Record<string, unknown>; seo?: unknown };
  return saveCmsItem(
    sellerId,
    storeId,
    found.collection.id,
    itemId,
    {
      slug: snapshot.slug ?? found.item.slug,
      status: found.item.status === "published" ? "published" : "draft",
      publishedAt: found.item.publishedAt,
      data: snapshot.data ?? {},
      seo: snapshot.seo ?? {},
    },
    userId,
    q,
  );
}

// ---------------------------------------------------------------------------
// Public reads (store resolved from the request host)
// ---------------------------------------------------------------------------

/** status = published AND published_at <= now(): mirrors isCmsItemPublic. */
const isPublic = and(eq(cmsItems.status, "published"), sql`${cmsItems.publishedAt} IS NOT NULL AND ${cmsItems.publishedAt} <= now()`);

/** The store is live (active, not deleted). Hosts resolve the store first; this is a backstop. */
const liveStore = sql`EXISTS (SELECT 1 FROM ${stores} s WHERE s.id = ${cmsItems.storeId} AND s.deleted_at IS NULL AND s.status = 'active')`;

const publicColumns = {
  id: cmsItems.id,
  slug: cmsItems.slug,
  data: cmsItems.data,
  seo: cmsItems.seo,
  publishedAt: cmsItems.publishedAt,
  updatedAt: cmsItems.updatedAt,
  collectionSlug: cmsCollections.slug,
  collectionKind: cmsCollections.kind,
};

function toPublic(row: {
  id: string;
  slug: string;
  data: unknown;
  seo: unknown;
  publishedAt: string | null;
  updatedAt: string;
  collectionSlug: string;
  collectionKind: string;
}): PublicCmsItem {
  const seo = cmsSeoSchema.safeParse(row.seo ?? {});
  return {
    id: row.id,
    collectionSlug: row.collectionSlug,
    collectionKind: row.collectionKind,
    slug: row.slug,
    data: (row.data ?? {}) as Record<string, unknown>,
    seo: seo.success ? seo.data : {},
    publishedAt: row.publishedAt!,
    updatedAt: row.updatedAt,
  };
}

export type PublicCmsCollection = { id: string; kind: string; name: string; slug: string; description: string | null; fields: CmsFieldDef[] };

/** A collection of a live store by slug (fields included), or null. */
export async function getPublicCmsCollection(storeId: string, collectionSlug: string, q: Queryable = db): Promise<PublicCmsCollection | null> {
  if (!UUID_RE.test(storeId) || !/^[a-z0-9-]{1,128}$/.test(collectionSlug)) return null;
  const [row] = await q
    .select({ id: cmsCollections.id, kind: cmsCollections.kind, name: cmsCollections.name, slug: cmsCollections.slug, description: cmsCollections.description, fields: cmsCollections.fields })
    .from(cmsCollections)
    .innerJoin(stores, and(eq(stores.id, cmsCollections.storeId), isNull(stores.deletedAt), eq(stores.status, "active")))
    .where(and(eq(cmsCollections.storeId, storeId), eq(cmsCollections.slug, collectionSlug)))
    .limit(1);
  return row ? { ...row, fields: collectionFields(row) } : null;
}

/**
 * Published, due items of one collection of the store, newest first. Never
 * drafts or scheduled items. `tag` filters on the `tags` field (blog).
 */
export async function listPublicCmsItems(
  storeId: string,
  collectionSlug: string,
  options: { limit?: number; offset?: number; tag?: string | null } = {},
  q: Queryable = db,
): Promise<{ items: PublicCmsItem[]; total: number }> {
  if (!UUID_RE.test(storeId) || !/^[a-z0-9-]{1,128}$/.test(collectionSlug)) return { items: [], total: 0 };
  const tag = options.tag?.trim().toLowerCase().slice(0, 40) || null;
  const where = and(
    eq(cmsItems.storeId, storeId),
    eq(cmsCollections.slug, collectionSlug),
    isPublic,
    liveStore,
    tag ? sql`${cmsItems.data} -> 'tags' ? ${tag}` : undefined,
  );
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const [rows, [{ n } = { n: 0 }]] = await Promise.all([
    q
      .select(publicColumns)
      .from(cmsItems)
      .innerJoin(cmsCollections, and(eq(cmsCollections.id, cmsItems.collectionId), eq(cmsCollections.storeId, cmsItems.storeId)))
      .where(where)
      .orderBy(desc(cmsItems.publishedAt), desc(cmsItems.createdAt))
      .limit(limit)
      .offset(Math.max(options.offset ?? 0, 0)),
    q
      .select({ n: count() })
      .from(cmsItems)
      .innerJoin(cmsCollections, and(eq(cmsCollections.id, cmsItems.collectionId), eq(cmsCollections.storeId, cmsItems.storeId)))
      .where(where),
  ]);
  return { items: rows.map(toPublic), total: Number(n) };
}

/** One published, due item of the store by collection + slug, or null (another store's slug is null too). */
export async function getPublicCmsItem(storeId: string, collectionSlug: string, itemSlug: string, q: Queryable = db): Promise<PublicCmsItem | null> {
  if (!UUID_RE.test(storeId) || !/^[a-z0-9-]{1,128}$/.test(collectionSlug) || !/^[a-z0-9-]{1,200}$/.test(itemSlug)) return null;
  const [row] = await q
    .select(publicColumns)
    .from(cmsItems)
    .innerJoin(cmsCollections, and(eq(cmsCollections.id, cmsItems.collectionId), eq(cmsCollections.storeId, cmsItems.storeId)))
    .where(and(eq(cmsItems.storeId, storeId), eq(cmsCollections.slug, collectionSlug), eq(cmsItems.slug, itemSlug), isPublic, liveStore))
    .limit(1);
  return row ? toPublic(row) : null;
}

/** Tags used by the store's published blog posts, most used first. */
export async function listPublicBlogTags(storeId: string, q: Queryable = db): Promise<{ tag: string; count: number }[]> {
  if (!UUID_RE.test(storeId)) return [];
  const rows = await q.execute<{ tag: string; n: number }>(sql`
    SELECT t.tag, count(*)::int AS n
    FROM ${cmsItems} i
    JOIN ${cmsCollections} c ON c.id = i.collection_id AND c.store_id = i.store_id AND c.slug = ${BLOG_COLLECTION_SLUG}
    CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(i.data -> 'tags') = 'array' THEN i.data -> 'tags' ELSE '[]'::jsonb END) AS t(tag)
    WHERE i.store_id = ${storeId}
      AND i.status = 'published' AND i.published_at IS NOT NULL AND i.published_at <= now()
    GROUP BY t.tag
    ORDER BY n DESC, t.tag
    LIMIT 30
  `);
  return [...rows].map((r) => ({ tag: r.tag, count: Number(r.n) }));
}

/**
 * Public paths of every published blog post and CMS item of the store, with
 * their last change, for the store sitemap (P5-04). Items marked noindex are
 * left out. Paths have no locale prefix (Arabic is the default).
 */
export async function listPublicCmsUrls(storeId: string, q: Queryable = db): Promise<{ path: string; lastmod: string }[]> {
  if (!UUID_RE.test(storeId)) return [];
  const rows = await q
    .select({ slug: cmsItems.slug, collectionSlug: cmsCollections.slug, updatedAt: cmsItems.updatedAt, seo: cmsItems.seo })
    .from(cmsItems)
    .innerJoin(cmsCollections, and(eq(cmsCollections.id, cmsItems.collectionId), eq(cmsCollections.storeId, cmsItems.storeId)))
    .where(and(eq(cmsItems.storeId, storeId), isPublic, liveStore))
    .orderBy(desc(cmsItems.updatedAt))
    .limit(5000);
  const urls = rows
    .filter((row) => (row.seo as { noindex?: unknown } | null)?.noindex !== true)
    .map((row) => ({ path: cmsItemPath(row.collectionSlug, row.slug), lastmod: new Date(row.updatedAt).toISOString() }));
  if (rows.some((row) => row.collectionSlug === BLOG_COLLECTION_SLUG)) {
    const newest = rows.find((row) => row.collectionSlug === BLOG_COLLECTION_SLUG)!;
    urls.unshift({ path: `/${BLOG_COLLECTION_SLUG}`, lastmod: new Date(newest.updatedAt).toISOString() });
  }
  return urls;
}

/**
 * Items for the content sections of a page (`collectContentQueries`), keyed by
 * section instance id. One query per distinct collection; only this store's
 * published, due items.
 */
export async function resolvePublicContent(
  storeId: string,
  queries: Record<string, { collection: string; limit: number; slug?: string | null }>,
  q: Queryable = db,
): Promise<{ items: Record<string, PublicCmsItem[]>; fields: Record<string, CmsFieldDef[]> }> {
  const entries = Object.entries(queries);
  if (!entries.length || !UUID_RE.test(storeId)) return { items: {}, fields: {} };
  const slugs = [...new Set(entries.map(([, query]) => query.collection))].filter((s) => /^[a-z0-9-]{1,128}$/.test(s));
  if (!slugs.length) return { items: {}, fields: {} };

  const collections = await q
    .select({ slug: cmsCollections.slug, kind: cmsCollections.kind, fields: cmsCollections.fields })
    .from(cmsCollections)
    .where(and(eq(cmsCollections.storeId, storeId), inArray(cmsCollections.slug, slugs)));
  const fields = Object.fromEntries(collections.map((c) => [c.slug, collectionFields(c)]));

  const items: Record<string, PublicCmsItem[]> = {};
  await Promise.all(
    entries.map(async ([instanceId, query]) => {
      if (!fields[query.collection]) {
        items[instanceId] = [];
        return;
      }
      if (query.slug) {
        const one = await getPublicCmsItem(storeId, query.collection, query.slug, q);
        items[instanceId] = one ? [one] : [];
        return;
      }
      const { items: list } = await listPublicCmsItems(storeId, query.collection, { limit: query.limit }, q);
      items[instanceId] = list;
    }),
  );
  return { items, fields };
}

// ---------------------------------------------------------------------------
// Blog (system collection) convenience wrappers
// ---------------------------------------------------------------------------

/** Posts of the store's blog for the dashboard (creates the blog on first use). */
export async function listBlogPosts(sellerId: string, storeId: string, filters: CmsItemFilters = {}, q: Queryable = db) {
  const blog = await ensureBlogCollection(sellerId, storeId, q);
  if (!blog.success) return null;
  const list = await listCmsItems(sellerId, storeId, blog.data.id, filters, q);
  return list ? { collection: blog.data, ...list } : null;
}

/** Creates (postId = null) or updates a blog post. */
export async function saveBlogPost(
  sellerId: string,
  storeId: string,
  postId: string | null,
  input: unknown,
  userId: string | null,
  q: Queryable = db,
) {
  const blog = await ensureBlogCollection(sellerId, storeId, q);
  if (!blog.success) return blog;
  return saveCmsItem(sellerId, storeId, blog.data.id, postId, input, userId, q);
}
