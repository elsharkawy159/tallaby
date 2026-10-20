"use server";

import { MEDIA_BUCKET, buildMediaPath, checkMediaPath, isMediaMimeType } from "@workspace/lib/media";
import {
  countMediaUsage,
  createMediaFolder,
  deleteMediaAsset,
  deleteMediaFolder,
  listMediaLibrary,
  recordMediaAsset,
  renameMediaFolder,
  updateMediaAsset,
} from "@workspace/lib/media/server";
import { resolveStoreForAdmin, type AdminStoreRef } from "@workspace/lib/admin/server";
import { logServerError } from "@workspace/db/log";
import { getServiceClient } from "@workspace/db/supabase/service";
import { toAssetView, toFolderView } from "@workspace/store-editor/media/media.lib";
import { MEDIA_ERRORS, type MediaAssetView, type MediaErrorKey, type MediaFolderView, type MediaLibraryView, type MediaResult } from "@workspace/store-editor/media/media.dto";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * A store's media library in the admin editor (spec §5.2 "Media"). Same lib
 * functions as the seller's, with the sellerId resolved from the store id.
 * The admin's own session cannot write to the seller's Storage folder, so an
 * upload goes through a signed upload URL made here with the service role for
 * a path that is checked to be in that seller's folder (this store or shared);
 * the service-role key never leaves the server.
 */

const uploadLimiter = createRateLimiter({ limit: 300, windowMs: 10 * 60_000 });
const MAX_BATCH = 20;
const DISCARD_ON = new Set(["too_large", "invalid_type", "invalid_folder", "too_many", "store_read_only", "invalid_input"]);

type Ctx = { actorId: string; ref: AdminStoreRef };

function fail<T>(error: string): MediaResult<T> {
  return { success: false, error: MEDIA_ERRORS[error] ?? (error as MediaErrorKey) ?? "generic" };
}

async function withStore<T>(storeId: string, forWrite: boolean, run: (ctx: Ctx) => Promise<MediaResult<T>>): Promise<MediaResult<T>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("notFound");
  try {
    const ref = await resolveStoreForAdmin(actorId, String(storeId));
    if (!ref) return fail("notFound");
    if (forWrite && ref.status !== "active") return fail("readOnly");
    return await run({ actorId, ref });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "not_admin") return fail("notFound");
    logServerError("admin", "store media action failed", { storeId: String(storeId) }, error);
    return fail("generic");
  }
}

/** Removes a store-media object with the service role (callers check the path belongs to the store first). */
async function removeObject(bucket: string, path: string) {
  const { error } = await getServiceClient().storage.from(bucket).remove([path]);
  if (error) throw new Error(`storage remove failed: ${error.message}`);
}

export async function listMedia(storeId: string, query: { folderId?: string | null; scope?: "all" | "store" | "shared" } = {}) {
  return withStore<MediaLibraryView>(storeId, false, async ({ ref }) => {
    const library = await listMediaLibrary(ref.sellerId, ref.storeId, query);
    if (!library) return fail("notFound");
    const usage = await countMediaUsage(ref.sellerId, ref.storeId, library.assets.map((a) => a.storagePath));
    return {
      success: true,
      data: { folders: library.folders.map(toFolderView), assets: library.assets.map((a) => toAssetView(a, usage[a.storagePath] ?? 0)) },
    };
  });
}

/** Fresh object paths in the seller's folder: '{seller}/{store|shared}/{uuid}.{ext}'. */
export async function createUploadPaths(storeId: string, input: { shared: boolean; types: string[] }) {
  return withStore<string[]>(storeId, true, async ({ ref }) => {
    const types = Array.isArray(input?.types) ? input.types : [];
    if (!types.length || types.length > MAX_BATCH || typeof input.shared !== "boolean") return fail("invalidInput");
    if (!types.every(isMediaMimeType)) return fail("invalidType");
    return { success: true, data: types.map((type) => buildMediaPath(ref.sellerId, input.shared ? null : ref.storeId, type)) };
  });
}

/**
 * A one-time signed upload for one path from createUploadPaths. The path must
 * be in this store's seller folder (this store or shared); the browser then
 * uploads the bytes with the token, and recordUpload checks size and type.
 */
export async function createSignedUpload(storeId: string, path: string) {
  return withStore<{ path: string; token: string }>(storeId, true, async ({ actorId, ref }) => {
    if (!uploadLimiter.check(`admin-media:${actorId}`)) return fail("rateLimited");
    if (checkMediaPath(path, ref.sellerId, ref.storeId) !== null) return fail("invalidPath");
    const { data, error } = await getServiceClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(String(path));
    if (error || !data) throw new Error(`signed upload failed: ${error?.message ?? "no data"}`);
    return { success: true, data: { path: data.path, token: data.token } };
  });
}

/** Records an uploaded object; a rejected upload in the store's folder is removed again. */
export async function recordUpload(
  storeId: string,
  input: { storagePath: string; filename: string; width?: number | null; height?: number | null; folderId?: string | null },
) {
  return withStore<MediaAssetView>(storeId, true, async ({ actorId, ref }) => {
    if (!uploadLimiter.check(`admin-media:${actorId}`)) return fail("rateLimited");
    const result = await recordMediaAsset(ref.sellerId, ref.storeId, input);
    if (!result.success) {
      if (DISCARD_ON.has(result.error) && checkMediaPath(input?.storagePath, ref.sellerId, ref.storeId) === null) {
        await removeObject(MEDIA_BUCKET, input.storagePath).catch((error) => console.error("[admin-media] discard failed", (error as Error).message));
      }
      return fail(result.error);
    }
    return { success: true, data: toAssetView(result.data, 0) };
  });
}

export async function updateMedia(storeId: string, assetId: string, input: { altText?: { ar?: string; en?: string }; folderId?: string | null }) {
  return withStore<MediaAssetView>(storeId, true, async ({ ref }) => {
    const result = await updateMediaAsset(ref.sellerId, ref.storeId, String(assetId), input);
    if (!result.success) return fail(result.error);
    const usage = await countMediaUsage(ref.sellerId, ref.storeId, [result.data.storagePath]);
    return { success: true, data: toAssetView(result.data, usage[result.data.storagePath] ?? 0) };
  });
}

/** Deletes the Storage object and the row together (the lib only finds this store's or shared assets). */
export async function deleteMedia(storeId: string, assetId: string) {
  return withStore<null>(storeId, true, async ({ ref }) => {
    try {
      const result = await deleteMediaAsset(ref.sellerId, ref.storeId, String(assetId), removeObject);
      if (!result.success) return fail(result.error);
    } catch (error) {
      console.error("[admin-media] delete failed", (error as Error)?.message);
      return fail("deleteFailed");
    }
    return { success: true, data: null };
  });
}

export async function createFolder(storeId: string, input: { name: string; parentId?: string | null; shared: boolean }) {
  return withStore<MediaFolderView>(storeId, true, async ({ ref }) => {
    const result = await createMediaFolder(ref.sellerId, ref.storeId, input);
    return result.success ? { success: true, data: toFolderView(result.data) } : fail(result.error);
  });
}

export async function renameFolder(storeId: string, folderId: string, name: string) {
  return withStore<MediaFolderView>(storeId, true, async ({ ref }) => {
    const result = await renameMediaFolder(ref.sellerId, ref.storeId, String(folderId), String(name ?? ""));
    return result.success ? { success: true, data: toFolderView(result.data) } : fail(result.error);
  });
}

export async function deleteFolder(storeId: string, folderId: string) {
  return withStore<null>(storeId, true, async ({ ref }) => {
    const result = await deleteMediaFolder(ref.sellerId, ref.storeId, String(folderId));
    return result.success ? { success: true, data: null } : fail(result.error);
  });
}
