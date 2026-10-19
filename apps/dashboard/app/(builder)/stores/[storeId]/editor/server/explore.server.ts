"use server";

import { revalidatePath } from "next/cache";
import { MEDIA_BUCKET, MEDIA_MAX_BYTES, buildMediaPath, isMediaMimeType } from "@workspace/lib/media";
import { recordMediaAsset } from "@workspace/lib/media/server";
import { toAssetView } from "@/components/media/media.lib";
import type { MediaAssetView } from "@/components/media/media.dto";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { PexelsUnavailable, getPexelsPhoto, pexelsConfigured, searchPexels } from "@/lib/stock-photos/pexels.server";
import { PHOTO_ID_RE, cleanQuery, importSource, isPexelsImageUrl, type StockPhotoPage } from "@/lib/stock-photos/stock-photos.lib";
import { createClient } from "@/supabase/server";

/**
 * Explore tab actions (owner request 2026-10-18): Pexels search and import.
 * The store id is explicit and re-checked; the Pexels key stays on the
 * server. Import never takes a URL from the browser: it looks the photo up
 * by id and downloads only from images.pexels.com, then stores it in this
 * store's media library like an upload (same path rules and size limit).
 */

export type ExploreErrorKey = "notFound" | "readOnly" | "unavailable" | "rateLimited" | "invalidInput" | "tooLarge" | "tooMany" | "generic";
export type ExploreResult<T> = { success: true; data: T } | { success: false; error: ExploreErrorKey };

const searchLimiter = createRateLimiter({ limit: 120, windowMs: 10 * 60_000 });
const importLimiter = createRateLimiter({ limit: 40, windowMs: 10 * 60_000 });

async function guard<T>(run: () => Promise<ExploreResult<T>>): Promise<ExploreResult<T>> {
  try {
    if (!pexelsConfigured()) return { success: false, error: "unavailable" };
    return await run();
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    if (error instanceof PexelsUnavailable) return { success: false, error: "unavailable" };
    console.error("[explore] action failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

export async function searchStockPhotos(storeId: string, query: string, page = 1): Promise<ExploreResult<StockPhotoPage>> {
  return guard(async () => {
    const { seller } = await requireStore(String(storeId));
    const q = cleanQuery(query);
    const n = Number(page);
    if (!q || !Number.isInteger(n) || n < 1 || n > 50) return { success: false, error: "invalidInput" };
    if (!searchLimiter.check(`explore:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    return { success: true, data: await searchPexels(q.toLowerCase(), n) };
  });
}

/** Copies a Pexels photo into this store's media library and returns the asset. */
export async function importStockPhoto(storeId: string, photoId: string): Promise<ExploreResult<MediaAssetView>> {
  return guard(async () => {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    const id = String(photoId);
    if (!PHOTO_ID_RE.test(id)) return { success: false, error: "invalidInput" };
    if (!importLimiter.check(`explore-import:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const photo = await getPexelsPhoto(id);
    const source = photo && importSource(photo);
    if (!photo || !source) return { success: false, error: "notFound" };

    const response = await fetch(source.url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!response.ok || !isPexelsImageUrl(response.url || source.url)) return { success: false, error: "generic" };
    const type = (response.headers.get("content-type") ?? "").split(";")[0]!.trim();
    if (!isMediaMimeType(type)) return { success: false, error: "generic" };
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MEDIA_MAX_BYTES) return { success: false, error: "tooLarge" };
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MEDIA_MAX_BYTES) return { success: false, error: "tooLarge" };

    // The seller's own session uploads, so the bucket policy limits it to their folder.
    const path = buildMediaPath(seller.sellerId, store.id, type);
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: type, upsert: false });
    if (uploadError) throw new Error(`storage upload failed: ${uploadError.message}`);

    const result = await recordMediaAsset(seller.sellerId, store.id, {
      storagePath: path,
      filename: `pexels-${id}.${path.split(".").pop()}`,
      width: source.width,
      height: source.height,
      ...(photo.alt ? { altText: { en: photo.alt.slice(0, 200) } } : {}),
    });
    if (!result.success) {
      await supabase.storage.from(MEDIA_BUCKET).remove([path]).catch(() => undefined);
      return { success: false, error: result.error === "too_many" ? "tooMany" : result.error === "too_large" ? "tooLarge" : "generic" };
    }
    revalidatePath(`/stores/${store.id}/website/media`);
    return { success: true, data: toAssetView(result.data, 0) };
  });
}
