"use server";

import { getServiceClient } from "@workspace/db/supabase/service";
import { MEDIA_BUCKET, parseMediaPath } from "@workspace/lib/media";
import { TOP_UP_PROOF_BUCKET, isOwnTopUpProofPath } from "@workspace/lib/store-wallet";
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
