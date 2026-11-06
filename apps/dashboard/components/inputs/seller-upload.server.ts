"use server";

import { getServiceClient } from "@workspace/db/supabase/service";
import { MEDIA_BUCKET, parseMediaPath } from "@workspace/lib/media";
import { TOP_UP_PROOF_BUCKET, isOwnTopUpProofPath } from "@workspace/lib/store-wallet";
import { randomUUID } from "node:crypto";
import { THEME_REQUEST_BUCKET, buildThemeRequestImagePath, themeRequestImageProblem } from "@workspace/lib/theme-requests";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * One-time signed upload URLs for the private, seller-folder buckets.
 *
 * The auth cookies are httpOnly outside development, so the browser Supabase
 * client has no session and a direct upload runs as `anon`, which the
 * "owners can upload" Storage policies reject. Instead the server checks the
 * session's seller and the path, then signs an upload for that exact path
 * (never an overwrite). The bucket's own size and type limits still apply.
 */

const PATH_CHECKS: Record<string, (sellerId: string, path: string) => boolean> = {
  [TOP_UP_PROOF_BUCKET]: isOwnTopUpProofPath,
  [MEDIA_BUCKET]: (sellerId, path) => parseMediaPath(path)?.sellerId === sellerId.toLowerCase(),
};

const limiter = createRateLimiter({ limit: 300, windowMs: 10 * 60_000 });

export type SignedUploadResult = { success: true; token: string } | { success: false; error: "notAllowed" | "invalidPath" | "generic" };

/** Public `sellers` bucket: logos, banners and document scans, each under `<folder>/<sellerId>/` (0152's policies). */
// ("use server" files may export only async functions.)
const SELLERS_BUCKET = "sellers";
const SELLERS_BUCKET_FOLDERS = new Set(["logos", "banners", "documents"]);
// `<Date.now()>-<slug>.<ext>`, the name `generateImageName` makes.
const SELLERS_FILE_NAME_RE = /^\d{10,16}-[a-z0-9-]{0,200}\.[A-Za-z0-9]{1,16}$/;

export type SellersBucketUploadResult =
  | { success: true; token: string; path: string }
  | { success: false; error: "notAllowed" | "invalidPath" | "generic" };

/**
 * Signs an upload into the session seller's own folder of the public
 * `sellers` bucket. The server builds the path (`<folder>/<sellerId>/<file>`),
 * so a browser can never write into another seller's folder, and the bucket
 * no longer accepts anonymous uploads (0152).
 */
export async function createSellersBucketUploadUrl(folder: string, fileName: string): Promise<SellersBucketUploadResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!SELLERS_BUCKET_FOLDERS.has(String(folder)) || !SELLERS_FILE_NAME_RE.test(String(fileName))) {
      return { success: false, error: "invalidPath" };
    }
    if (!limiter.check(`upload:${seller.sellerId}`)) return { success: false, error: "notAllowed" };

    const path = `${folder}/${seller.sellerId.toLowerCase()}/${fileName}`;
    const { data, error } = await getServiceClient().storage.from(SELLERS_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[seller-upload] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token, path };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notAllowed" };
    console.error("[seller-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

/**
 * Signs an upload of one product photo into the session seller's own folder
 * of the public `products` bucket: `<sellerId>/<YYYY-MM-DD>/<file>`. The bucket
 * has no write policies (0153), so the browser can only write the exact path
 * the server signed here. Older flat `<YYYY-MM-DD>/<file>` paths stay readable.
 */
export async function createProductImageUploadUrl(fileName: string): Promise<SellersBucketUploadResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!SELLERS_FILE_NAME_RE.test(String(fileName))) return { success: false, error: "invalidPath" };
    if (!limiter.check(`upload:${seller.sellerId}`)) return { success: false, error: "notAllowed" };

    const path = `${seller.sellerId.toLowerCase()}/${new Date().toISOString().slice(0, 10)}/${fileName}`;
    const { data, error } = await getServiceClient().storage.from("products").createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[seller-upload] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token, path };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notAllowed" };
    console.error("[seller-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

/**
 * Signs one "Request a theme" image (ROADMAP.md F-77) into the session
 * seller's own folder of the private `theme-request-images` bucket:
 * `<sellerId>/<uuid>.<ext>`. Type and size are checked here and again by the
 * bucket (0156: 5 MB, JPEG/PNG/WebP). The bucket has no storage policies, so
 * the browser can only write the exact path signed here.
 */
export async function createThemeRequestImageUploadUrl(file: { type: string; size: number }): Promise<SellersBucketUploadResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const type = String(file?.type ?? "");
    if (themeRequestImageProblem({ type, size: Number(file?.size) })) return { success: false, error: "invalidPath" };
    if (!limiter.check(`upload:${seller.sellerId}`)) return { success: false, error: "notAllowed" };

    const path = buildThemeRequestImagePath(seller.sellerId, randomUUID(), type);
    if (!path) return { success: false, error: "invalidPath" };
    const { data, error } = await getServiceClient().storage.from(THEME_REQUEST_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[seller-upload] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token, path };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notAllowed" };
    console.error("[seller-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

export async function createSellerUploadUrl(bucket: string, path: string): Promise<SignedUploadResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const check = PATH_CHECKS[String(bucket)];
    if (!check || !check(seller.sellerId, String(path))) return { success: false, error: "invalidPath" };
    if (!limiter.check(`upload:${seller.sellerId}`)) return { success: false, error: "notAllowed" };

    const { data, error } = await getServiceClient().storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[seller-upload] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notAllowed" };
    console.error("[seller-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
