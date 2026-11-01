import { randomUUID } from "node:crypto";
import { getServiceClient } from "@workspace/db/supabase/service";
import { fetchPublicImage, SafeFetchError } from "@workspace/lib/agents/server";
import type { ProductImageUploader } from "@workspace/lib/products/agent/server";

const REASONS: Record<SafeFetchError["code"], string> = {
  bad_url: "not a valid public https link",
  private_address: "points to a private network address",
  http_error: "could not be downloaded",
  too_large: "is larger than 5 MB",
  timeout: "took too long to download",
  bad_body: "is not a JPEG, PNG or WebP image",
};

function todayFolder(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Downloads a photo an assistant linked (SSRF-guarded, bytes sniffed) and
 * stores it in the "products" bucket the way the dashboard's image import
 * does (`YYYY-MM-DD/<uuid>.<ext>`). The service-role key stays server-side.
 */
export const uploadProductImageFromUrl: ProductImageUploader = async (url) => {
  try {
    const image = await fetchPublicImage(url);
    const path = `${todayFolder()}/${randomUUID()}.${image.ext}`;
    const { data, error } = await getServiceClient()
      .storage.from("products")
      .upload(path, image.bytes, { contentType: image.mime, cacheControl: "31536000", upsert: false });
    if (error || !data?.path) return { ok: false, reason: "could not be stored" };
    return { ok: true, path: data.path };
  } catch (error) {
    if (error instanceof SafeFetchError) return { ok: false, reason: REASONS[error.code] };
    return { ok: false, reason: "could not be downloaded" };
  }
};
