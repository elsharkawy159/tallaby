/**
 * Server-only data access for the media library (PLAN.md §11.5, P4-09).
 *
 * Media belongs to the seller account; an item is either shared by all of the
 * seller's stores (store_id NULL) or belongs to one store. Every function takes
 * the session's sellerId and the store the caller is working in (never client
 * values) and sees only that seller's shared items plus that store's own items:
 * another seller's media, and another of the seller's stores' media, are
 * `not_found`. A store that is missing, deleted or foreign is `not_found` too.
 * Functions accept an optional Drizzle handle (`q`) like stores/server.ts.
 */
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  isNull,
  mediaAssets,
  mediaFolders,
  or,
  sellers,
  sql,
  storePages,
  stores,
} from "@workspace/db";
import {
  MEDIA_BUCKET,
  MEDIA_LIST_LIMIT,
  MEDIA_MAX_ASSETS_PER_SELLER,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_FOLDERS_PER_SELLER,
  checkMediaPath,
  isUuid,
  mediaFolderInputSchema,
  mediaListQuerySchema,
  mimeMatchesPath,
  parseMediaPath,
  recordMediaInputSchema,
  updateMediaAssetSchema,
  type MediaAltText,
  type MediaFolderInput,
  type MediaListQuery,
  type MediaPathProblem,
  type RecordMediaInput,
  type UpdateMediaAssetInput,
} from "./media.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type MediaResult<T, E extends string> = { success: true; data: T } | { success: false; error: E };

export type MediaFolderRow = {
  id: string;
  name: string;
  parentId: string | null;
  /** null = shared by all of the seller's stores. */
  storeId: string | null;
  createdAt: string;
};

export type MediaAssetRow = {
  id: string;
  storeId: string | null;
  folderId: string | null;
  storagePath: string;
  filename: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: MediaAltText;
  createdAt: string;
};

const FOLDER_COLUMNS = {
  id: mediaFolders.id,
  name: mediaFolders.name,
  parentId: mediaFolders.parentId,
  storeId: mediaFolders.storeId,
  createdAt: mediaFolders.createdAt,
};

const ASSET_COLUMNS = {
  id: mediaAssets.id,
  storeId: mediaAssets.storeId,
  folderId: mediaAssets.folderId,
  storagePath: mediaAssets.storagePath,
  filename: mediaAssets.filename,
  mimeType: mediaAssets.mimeType,
  bytes: mediaAssets.bytes,
  width: mediaAssets.width,
  height: mediaAssets.height,
  altText: mediaAssets.altText,
  createdAt: mediaAssets.createdAt,
};

class MediaError<E extends string> extends Error {
  constructor(readonly code: E) {
    super(code);
  }
}

const asAsset = (row: Omit<MediaAssetRow, "altText"> & { altText: unknown }): MediaAssetRow => ({
  ...row,
  altText: (row.altText ?? {}) as MediaAltText,
});

/** The seller's shared items plus this store's own items. */
const visibleAssets = (sellerId: string, storeId: string) =>
  and(eq(mediaAssets.sellerId, sellerId), or(eq(mediaAssets.storeId, storeId), isNull(mediaAssets.storeId)));

const visibleFolders = (sellerId: string, storeId: string) =>
  and(eq(mediaFolders.sellerId, sellerId), or(eq(mediaFolders.storeId, storeId), isNull(mediaFolders.storeId)));

async function loadStore(q: Queryable, sellerId: string, storeId: string) {
  if (!isUuid(storeId)) return null;
  const [row] = await q
    .select({ id: stores.id, status: stores.status })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  return row ?? null;
}

/** The store for a write: missing/foreign → not_found, not active → store_read_only. */
async function writableStore(q: Queryable, sellerId: string, storeId: string): Promise<"not_found" | "store_read_only" | null> {
  const store = await loadStore(q, sellerId, storeId);
  if (!store) return "not_found";
  return store.status === "active" ? null : "store_read_only";
}

async function loadFolder(q: Queryable, sellerId: string, storeId: string, folderId: string) {
  if (!isUuid(folderId)) return null;
  const [row] = await q
    .select(FOLDER_COLUMNS)
    .from(mediaFolders)
    .where(and(eq(mediaFolders.id, folderId), visibleFolders(sellerId, storeId)))
    .limit(1);
  return row ?? null;
}

/**
 * A folder holds items of its own scope only (shared ↔ shared, store ↔ the
 * same store), so a shared folder never shows one store's files to another.
 */
async function folderFits(q: Queryable, sellerId: string, storeId: string, folderId: string, scopeStoreId: string | null) {
  const folder = await loadFolder(q, sellerId, storeId, folderId);
  return folder !== null && folder.storeId === scopeStoreId;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type MediaLibrary = { folders: MediaFolderRow[]; assets: MediaAssetRow[] };

/**
 * Every folder the store can see, and the assets of one folder (`folderId`
 * null = root, undefined = all folders), newest first. `scope` narrows to this
 * store's items or the shared ones. null when the store is not the seller's.
 */
export async function listMediaLibrary(
  sellerId: string,
  storeId: string,
  query: MediaListQuery = {},
  q: Queryable = db,
): Promise<MediaLibrary | null> {
  const parsed = mediaListQuerySchema.safeParse(query);
  if (!parsed.success) return null;
  if (!(await loadStore(q, sellerId, storeId))) return null;
  const { folderId, scope } = parsed.data;

  const filters = [visibleAssets(sellerId, storeId)];
  if (scope === "store") filters.push(eq(mediaAssets.storeId, storeId));
  if (scope === "shared") filters.push(isNull(mediaAssets.storeId));
  if (folderId === null) filters.push(isNull(mediaAssets.folderId));
  else if (folderId !== undefined) filters.push(eq(mediaAssets.folderId, folderId));

  const [folders, assets] = await Promise.all([
    q.select(FOLDER_COLUMNS).from(mediaFolders).where(visibleFolders(sellerId, storeId)).orderBy(asc(mediaFolders.name)),
    q
      .select(ASSET_COLUMNS)
      .from(mediaAssets)
      .where(and(...filters))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(MEDIA_LIST_LIMIT),
  ]);
  return { folders, assets: assets.map(asAsset) };
}

export async function getMediaAsset(sellerId: string, storeId: string, assetId: string, q: Queryable = db): Promise<MediaAssetRow | null> {
  if (!isUuid(assetId) || !(await loadStore(q, sellerId, storeId))) return null;
  const [row] = await q
    .select(ASSET_COLUMNS)
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, assetId), visibleAssets(sellerId, storeId)))
    .limit(1);
  return row ? asAsset(row) : null;
}

/**
 * How many places in this store's draft site (pages, header, footer) mention
 * each path. A cheap hint before deleting; it does not see other stores.
 */
export async function countMediaUsage(
  sellerId: string,
  storeId: string,
  paths: string[],
  q: Queryable = db,
): Promise<Record<string, number>> {
  const out: Record<string, number> = Object.fromEntries(paths.map((p) => [p, 0]));
  if (!paths.length || !isUuid(storeId)) return out;
  const [store] = await q
    .select({ header: sql<string | null>`${stores.sharedHeader}::text`, footer: sql<string | null>`${stores.sharedFooter}::text` })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) return out;
  const pages = await q
    .select({ content: sql<string | null>`${storePages.draftContent}::text` })
    .from(storePages)
    .where(eq(storePages.storeId, storeId));
  const texts = [store.header, store.footer, ...pages.map((p) => p.content)].filter((t): t is string => Boolean(t));
  for (const path of paths) out[path] = texts.filter((t) => t.includes(path)).length;
  return out;
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export type RecordMediaError =
  | "invalid_input"
  | MediaPathProblem
  | "not_found"
  | "store_read_only"
  | "object_missing"
  | "too_large"
  | "invalid_type"
  | "invalid_folder"
  | "too_many";

/**
 * Records an object the browser has just uploaded. The path must be in the
 * session seller's folder and either 'shared' or this store; the size and type
 * come from Storage's own metadata (storage.objects), never from the client.
 * Recording the same path twice returns the existing row.
 */
export async function recordMediaAsset(
  sellerId: string,
  storeId: string,
  input: RecordMediaInput,
  q: Queryable = db,
): Promise<MediaResult<MediaAssetRow, RecordMediaError>> {
  const parsed = recordMediaInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { storagePath, filename, width, height, folderId, altText } = parsed.data;

  const pathProblem = checkMediaPath(storagePath, sellerId, storeId);
  if (pathProblem) return { success: false, error: pathProblem };
  const scopeStoreId = parseMediaPath(storagePath)!.storeId;

  const storeProblem = await writableStore(q, sellerId, storeId);
  if (storeProblem) return { success: false, error: storeProblem };

  const [object] = await q.execute<{ size: string | null; mimetype: string | null }>(sql`
    SELECT metadata->>'size' AS size, metadata->>'mimetype' AS mimetype
    FROM storage.objects
    WHERE bucket_id = ${MEDIA_BUCKET} AND name = ${storagePath}
    LIMIT 1
  `);
  if (!object) return { success: false, error: "object_missing" };
  const bytes = Number(object.size);
  if (!Number.isFinite(bytes) || bytes < 0) return { success: false, error: "object_missing" };
  if (bytes > MEDIA_MAX_BYTES) return { success: false, error: "too_large" };
  const mimeType = object.mimetype ?? "";
  if (!mimeMatchesPath(mimeType, storagePath)) return { success: false, error: "invalid_type" };

  if (folderId && !(await folderFits(q, sellerId, storeId, folderId, scopeStoreId))) {
    return { success: false, error: "invalid_folder" };
  }

  try {
    const row = await q.transaction(async (tx) => {
      // Serialize per seller (the count check, and two records of one path).
      await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, sellerId)).for("update");
      const [existing] = await tx
        .select(ASSET_COLUMNS)
        .from(mediaAssets)
        .where(and(eq(mediaAssets.bucket, MEDIA_BUCKET), eq(mediaAssets.storagePath, storagePath), eq(mediaAssets.sellerId, sellerId)))
        .limit(1);
      if (existing) return existing;

      const [{ value: total } = { value: 0 }] = await tx
        .select({ value: count() })
        .from(mediaAssets)
        .where(eq(mediaAssets.sellerId, sellerId));
      if (total >= MEDIA_MAX_ASSETS_PER_SELLER) throw new MediaError("too_many");

      const [inserted] = await tx
        .insert(mediaAssets)
        .values({
          sellerId,
          storeId: scopeStoreId,
          folderId: folderId ?? null,
          bucket: MEDIA_BUCKET,
          storagePath,
          filename,
          mimeType,
          bytes,
          width: width ?? null,
          height: height ?? null,
          altText: cleanAlt(altText),
        })
        .onConflictDoNothing({ target: [mediaAssets.bucket, mediaAssets.storagePath] })
        .returning(ASSET_COLUMNS);
      // Another seller's row cannot hold this path (media_assets_path_owner CHECK).
      if (!inserted) throw new MediaError("invalid_input");
      return inserted;
    });
    return { success: true, data: asAsset(row) };
  } catch (error) {
    if (error instanceof MediaError) return { success: false, error: error.code as RecordMediaError };
    throw error;
  }
}

function cleanAlt(alt: MediaAltText | undefined): MediaAltText {
  const out: MediaAltText = {};
  if (alt?.ar) out.ar = alt.ar;
  if (alt?.en) out.en = alt.en;
  return out;
}

/** Alt text (replaced as a whole) and/or folder (null = root). */
export async function updateMediaAsset(
  sellerId: string,
  storeId: string,
  assetId: string,
  input: UpdateMediaAssetInput,
  q: Queryable = db,
): Promise<MediaResult<MediaAssetRow, "invalid_input" | "not_found" | "store_read_only" | "invalid_folder">> {
  const parsed = updateMediaAssetSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const storeProblem = await writableStore(q, sellerId, storeId);
  if (storeProblem) return { success: false, error: storeProblem };
  const asset = await getMediaAsset(sellerId, storeId, assetId, q);
  if (!asset) return { success: false, error: "not_found" };

  const patch: Partial<typeof mediaAssets.$inferInsert> = {};
  if (parsed.data.altText !== undefined) patch.altText = cleanAlt(parsed.data.altText);
  if (parsed.data.folderId !== undefined) {
    if (parsed.data.folderId !== null && !(await folderFits(q, sellerId, storeId, parsed.data.folderId, asset.storeId))) {
      return { success: false, error: "invalid_folder" };
    }
    patch.folderId = parsed.data.folderId;
  }
  if (!Object.keys(patch).length) return { success: true, data: asset };

  const [row] = await q
    .update(mediaAssets)
    .set(patch)
    .where(and(eq(mediaAssets.id, asset.id), visibleAssets(sellerId, storeId)))
    .returning(ASSET_COLUMNS);
  return row ? { success: true, data: asAsset(row) } : { success: false, error: "not_found" };
}

/**
 * Deletes the row and the Storage object together: the row is deleted inside
 * a transaction, `removeObject` runs before the commit, and if it throws the
 * row stays. The caller supplies the Storage call (the session's client).
 */
export async function deleteMediaAsset(
  sellerId: string,
  storeId: string,
  assetId: string,
  removeObject: (bucket: string, path: string) => Promise<void>,
  q: Queryable = db,
): Promise<MediaResult<{ storagePath: string }, "not_found" | "store_read_only">> {
  if (!isUuid(assetId)) return { success: false, error: "not_found" };
  const storeProblem = await writableStore(q, sellerId, storeId);
  if (storeProblem) return { success: false, error: storeProblem };
  return q.transaction(async (tx) => {
    const [row] = await tx
      .delete(mediaAssets)
      .where(and(eq(mediaAssets.id, assetId), visibleAssets(sellerId, storeId)))
      .returning({ bucket: mediaAssets.bucket, storagePath: mediaAssets.storagePath });
    if (!row) return { success: false, error: "not_found" } as const;
    await removeObject(row.bucket, row.storagePath);
    return { success: true, data: { storagePath: row.storagePath } } as const;
  });
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function createMediaFolder(
  sellerId: string,
  storeId: string,
  input: MediaFolderInput,
  q: Queryable = db,
): Promise<MediaResult<MediaFolderRow, "invalid_input" | "not_found" | "store_read_only" | "invalid_folder" | "too_many">> {
  const parsed = mediaFolderInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const storeProblem = await writableStore(q, sellerId, storeId);
  if (storeProblem) return { success: false, error: storeProblem };
  const scopeStoreId = parsed.data.shared ? null : storeId;
  const parentId = parsed.data.parentId ?? null;
  if (parentId && !(await folderFits(q, sellerId, storeId, parentId, scopeStoreId))) {
    return { success: false, error: "invalid_folder" };
  }

  try {
    const row = await q.transaction(async (tx) => {
      await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, sellerId)).for("update");
      const [{ value: total } = { value: 0 }] = await tx
        .select({ value: count() })
        .from(mediaFolders)
        .where(eq(mediaFolders.sellerId, sellerId));
      if (total >= MEDIA_MAX_FOLDERS_PER_SELLER) throw new MediaError("too_many");
      const [inserted] = await tx
        .insert(mediaFolders)
        .values({ sellerId, storeId: scopeStoreId, parentId, name: parsed.data.name })
        .returning(FOLDER_COLUMNS);
      return inserted!;
    });
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof MediaError) return { success: false, error: "too_many" };
    throw error;
  }
}

export async function renameMediaFolder(
  sellerId: string,
  storeId: string,
  folderId: string,
  name: string,
  q: Queryable = db,
): Promise<MediaResult<MediaFolderRow, "invalid_input" | "not_found" | "store_read_only">> {
  const parsed = mediaFolderInputSchema.shape.name.safeParse(name);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  if (!isUuid(folderId)) return { success: false, error: "not_found" };
  const storeProblem = await writableStore(q, sellerId, storeId);
  if (storeProblem) return { success: false, error: storeProblem };
  const [row] = await q
    .update(mediaFolders)
    .set({ name: parsed.data })
    .where(and(eq(mediaFolders.id, folderId), visibleFolders(sellerId, storeId)))
    .returning(FOLDER_COLUMNS);
  return row ? { success: true, data: row } : { success: false, error: "not_found" };
}

/** Deletes a folder and its sub-folders; their files move to the root (FK SET NULL). */
export async function deleteMediaFolder(
  sellerId: string,
  storeId: string,
  folderId: string,
  q: Queryable = db,
): Promise<MediaResult<null, "not_found" | "store_read_only">> {
  if (!isUuid(folderId)) return { success: false, error: "not_found" };
  const storeProblem = await writableStore(q, sellerId, storeId);
  if (storeProblem) return { success: false, error: storeProblem };
  const [row] = await q
    .delete(mediaFolders)
    .where(and(eq(mediaFolders.id, folderId), visibleFolders(sellerId, storeId)))
    .returning({ id: mediaFolders.id });
  return row ? { success: true, data: null } : { success: false, error: "not_found" };
}
