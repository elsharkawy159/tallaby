"use server";

import { randomUUID } from "node:crypto";
import { getServiceClient } from "@workspace/db/supabase/service";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Signs one review photo or video upload into the customer's own folder of the
 * public `products` bucket: `reviews/<userId>/<uuid>.<ext>`. The bucket has no
 * write policies (0153), so the browser can write only the exact path this
 * action signs with the service role. The user is the same one createReview
 * uses (signed in, or the existing guest), never an id from the client.
 */

const EXT_RE = /^[a-z0-9]{1,8}$/;
const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

export type ReviewUploadResult =
  | { success: true; token: string; path: string }
  | { success: false; error: "notAllowed" | "invalidPath" | "generic" };

export async function createReviewUploadUrl(extension: string): Promise<ReviewUploadResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "notAllowed" };
    const ext = String(extension ?? "").toLowerCase();
    if (!EXT_RE.test(ext)) return { success: false, error: "invalidPath" };
    if (!limiter.check(`review-upload:${userId}`)) return { success: false, error: "notAllowed" };

    const path = `reviews/${userId.toLowerCase()}/${Date.now()}-${randomUUID()}.${ext}`;
    const { data, error } = await getServiceClient().storage.from("products").createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[review-upload] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token, path };
  } catch (error) {
    console.error("[review-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
