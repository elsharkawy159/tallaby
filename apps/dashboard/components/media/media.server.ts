"use server";

import { revalidatePath } from "next/cache";
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
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { createClient } from "@/supabase/server";
import { toAssetView, toFolderView } from "@workspace/store-editor/media/media.lib";
import { MEDIA_ERRORS, type MediaAssetView, type MediaErrorKey, type MediaFolderView, type MediaLibraryView, type MediaResult } from "@workspace/store-editor/media/media.dto";

/**
 * Media library actions (PLAN.md P4-09), used by the library page and the
 * editor's image picker. The store id is explicit and re-checked with
 * requireStore; the seller id comes from the session only. Upload paths are
 * made here, the browser uploads to Storage under the seller's own folder
 * (bucket policy), and recordUpload checks the path, size and type before
 * the media_assets row exists.
 */

const uploadLimiter = createRateLimiter({ limit: 300, windowMs: 10 * 60_000 });
const MAX_BATCH = 20;

type Access = Awaited<ReturnType<typeof requireStore>>;

function fail<T>(error: string): MediaResult<T> {
  return { success: false, error: MEDIA_ERRORS[error] ?? (error as MediaErrorKey) ?? "generic" };
}

async function withStore<T>(storeId: string, forWrite: boolean, run: (access: Access) => Promise<MediaResult<T>>): Promise<MediaResult<T>> {
  try {
    const access = await requireStore(String(storeId), { forWrite });
    return await run(access);
  } catch (error) {
    if (isAccessError(error)) return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
    console.error("[media] action failed", (error as Error)?.message);
    return fail("generic");
  }
}

/** Removes a store-media object with the seller's own session (the bucket policy limits it to their folder). */
async function removeObject(bucket: string, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`storage remove failed: ${error.message}`);
}

const refresh = (storeId: string) => revalidatePath(`/stores/${storeId}/website/media`);

export async function listMedia(storeId: string, query: { folderId?: string | null; scope?: "all" | "store" | "shared" } = {}) {
  return withStore<MediaLibraryView>(storeId, false, async ({ seller, store }) => {
    const library = await listMediaLibrary(seller.sellerId, store.id, query);
    if (!library) return fail("notFound");
    const usage = await countMediaUsage(seller.sellerId, store.id, library.assets.map((a) => a.storagePath));
    return {
      success: true,
      data: { folders: library.folders.map(toFolderView), assets: library.assets.map((a) => toAssetView(a, usage[a.storagePath] ?? 0)) },
    };
  });
}

/** Fresh object paths for a batch of uploads: '{seller}/{store|shared}/{uuid}.{ext}'. */
export async function createUploadPaths(storeId: string, input: { shared: boolean; types: string[] }) {
  return withStore<string[]>(storeId, true, async ({ seller, store }) => {
    const types = Array.isArray(input?.types) ? input.types : [];
    if (!types.length || types.length > MAX_BATCH || typeof input.shared !== "boolean") return fail("invalidInput");
    if (!types.every(isMediaMimeType)) return fail("invalidType");
    return { success: true, data: types.map((type) => buildMediaPath(seller.sellerId, input.shared ? null : store.id, type)) };
  });
}

const DISCARD_ON = new Set(["too_large", "invalid_type", "invalid_folder", "too_many", "store_read_only", "invalid_input"]);

/** Records an uploaded object; a rejected upload in the seller's own folder is removed again. */
export async function recordUpload(
  storeId: string,
  input: { storagePath: string; filename: string; width?: number | null; height?: number | null; folderId?: string | null },
) {
  return withStore<MediaAssetView>(storeId, true, async ({ seller, store }) => {
    if (!uploadLimiter.check(`media:${seller.sellerId}`)) return fail("rateLimited");
    const result = await recordMediaAsset(seller.sellerId, store.id, input);
    if (!result.success) {
      if (DISCARD_ON.has(result.error) && checkMediaPath(input?.storagePath, seller.sellerId, store.id) === null) {
        await removeObject(MEDIA_BUCKET, input.storagePath).catch((error) => console.error("[media] discard failed", (error as Error).message));
      }
      return fail(result.error);
    }
    refresh(store.id);
    return { success: true, data: toAssetView(result.data, 0) };
  });
}

export async function updateMedia(storeId: string, assetId: string, input: { altText?: { ar?: string; en?: string }; folderId?: string | null }) {
  return withStore<MediaAssetView>(storeId, true, async ({ seller, store }) => {
    const result = await updateMediaAsset(seller.sellerId, store.id, String(assetId), input);
    if (!result.success) return fail(result.error);
    const usage = await countMediaUsage(seller.sellerId, store.id, [result.data.storagePath]);
    refresh(store.id);
    return { success: true, data: toAssetView(result.data, usage[result.data.storagePath] ?? 0) };
  });
}

/** Deletes the Storage object and the row together (the row stays if Storage fails). */
export async function deleteMedia(storeId: string, assetId: string) {
  return withStore<null>(storeId, true, async ({ seller, store }) => {
    try {
      const result = await deleteMediaAsset(seller.sellerId, store.id, String(assetId), removeObject);
      if (!result.success) return fail(result.error);
    } catch (error) {
      console.error("[media] delete failed", (error as Error)?.message);
      return fail("deleteFailed");
    }
    refresh(store.id);
    return { success: true, data: null };
  });
}

export async function createFolder(storeId: string, input: { name: string; parentId?: string | null; shared: boolean }) {
  return withStore<MediaFolderView>(storeId, true, async ({ seller, store }) => {
    const result = await createMediaFolder(seller.sellerId, store.id, input);
    if (!result.success) return fail(result.error);
    refresh(store.id);
    return { success: true, data: toFolderView(result.data) };
  });
}

export async function renameFolder(storeId: string, folderId: string, name: string) {
  return withStore<MediaFolderView>(storeId, true, async ({ seller, store }) => {
    const result = await renameMediaFolder(seller.sellerId, store.id, String(folderId), String(name ?? ""));
    if (!result.success) return fail(result.error);
    refresh(store.id);
    return { success: true, data: toFolderView(result.data) };
  });
}

export async function deleteFolder(storeId: string, folderId: string) {
  return withStore<null>(storeId, true, async ({ seller, store }) => {
    const result = await deleteMediaFolder(seller.sellerId, store.id, String(folderId));
    if (!result.success) return fail(result.error);
    refresh(store.id);
    return { success: true, data: null };
  });
}
