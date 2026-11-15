"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { MEDIA_BUCKET, checkMediaPath } from "@workspace/lib/media";
import {
  LOADING_SCREEN_MAX_BYTES,
  loadingScreenSchema,
  loadingScreenTypeMatchesPath,
  type StoreLoadingScreen,
} from "@workspace/lib/stores/loading-screen";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { LoadingScreenResult } from "./loading-screen.dto";

/**
 * Website › Design › Loading screen (ROADMAP.md F-96). The storeId is explicit
 * and re-checked with requireStore; the seller comes from the session only.
 * The input is validated by the shared schema, the media path must be in this
 * seller's folder for this store (or shared), and the object's real size and
 * type come from Storage's own metadata (never from the browser). Saved at
 * once in `stores.settings.loadingScreen` (other keys kept), like the logo on
 * the same page; the cached storefront profile is invalidated.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export async function saveLoadingScreen(storeId: string, input: unknown): Promise<LoadingScreenResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-loading-screen:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const parsed = loadingScreenSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.some((issue) => issue.message === "empty") ? "empty" : "invalidInput" };
    }
    const settings: StoreLoadingScreen = parsed.data;

    if (settings.mediaPath) {
      if (checkMediaPath(settings.mediaPath, seller.sellerId, store.id) !== null) return { success: false, error: "invalidMedia" };
      const rows = [
        ...((await db.execute(sql`
          SELECT metadata->>'size' AS size, metadata->>'mimetype' AS mimetype
            FROM storage.objects
           WHERE bucket_id = ${MEDIA_BUCKET} AND name = ${settings.mediaPath}
           LIMIT 1
        `)) as unknown as Iterable<{ size: string | null; mimetype: string | null }>),
      ];
      const object = rows[0];
      if (!object) return { success: false, error: "invalidMedia" };
      const bytes = Number(object.size);
      if (!Number.isFinite(bytes) || bytes <= 0 || bytes > LOADING_SCREEN_MAX_BYTES) return { success: false, error: "tooLarge" };
      if (!loadingScreenTypeMatchesPath(object.mimetype, settings.mediaPath)) return { success: false, error: "invalidType" };
    }

    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('loadingScreen', ${JSON.stringify(settings)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidatePath(`/stores/${store.id}/website/design`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, settings };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-loading-screen] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
