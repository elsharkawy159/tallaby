"use server";

import { getServiceClient } from "@workspace/db/supabase/service";
import { getAdminUser } from "@/actions/auth";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Signed uploads for the Admin image fields of the public `products`,
 * `brands` and `categories` buckets. Those buckets have no write policies
 * (0153), so the browser can write only the exact path this action signs with
 * the service role, after the same admin check the brand, category and product
 * actions use. The path keeps the existing `<YYYY-MM-DD>/<file>` layout, so
 * stored paths and their public URLs look the same as before.
 */

const BUCKETS = new Set(["products", "brands", "categories"]);
// `<Date.now()>-<slug>.<ext>`, the name `generateImageName` makes.
const FILE_NAME_RE = /^\d{10,16}-[a-z0-9-]{0,200}\.[A-Za-z0-9]{1,16}$/;

const limiter = createRateLimiter({ limit: 300, windowMs: 10 * 60_000 });

export type AdminImageUploadResult =
  | { success: true; token: string; path: string }
  | { success: false; error: "notAllowed" | "invalidPath" | "generic" };

export async function createAdminImageUploadUrl(bucket: string, fileName: string): Promise<AdminImageUploadResult> {
  let adminId: string;
  try {
    adminId = (await getAdminUser()).user.id;
  } catch {
    return { success: false, error: "notAllowed" };
  }
  if (!BUCKETS.has(String(bucket)) || !FILE_NAME_RE.test(String(fileName))) return { success: false, error: "invalidPath" };
  if (!limiter.check(`admin-image:${adminId}`)) return { success: false, error: "notAllowed" };

  try {
    const path = `${new Date().toISOString().slice(0, 10)}/${fileName}`;
    const { data, error } = await getServiceClient().storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[admin-image-upload] sign failed", error?.message);
      return { success: false, error: "generic" };
    }
    return { success: true, token: data.token, path };
  } catch (error) {
    console.error("[admin-image-upload] sign failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
