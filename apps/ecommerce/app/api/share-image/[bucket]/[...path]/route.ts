import { logServerError } from "@workspace/db/log";
import {
  isShareImageBucket,
  isValidShareImagePath,
  ownStorageOrigin,
  SHARE_IMAGE_TYPE,
  storageObjectUrl,
} from "@/lib/share-image/share-image.lib";
import { fetchOriginalImage, renderShareImage } from "@/lib/share-image/share-image.server";

export const runtime = "nodejs";

/**
 * Storage paths are unique (uploads never overwrite, docs/egress-audit.md §9),
 * so one path always gives the same card: cached for a year in browsers and on
 * the CDN (Vercel reads `Vercel-CDN-Cache-Control`, other CDNs `CDN-Cache-Control`).
 */
const LONG_CACHE = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
};
/** A failure may be passing (an upload not finished, a timeout): retried after 5 minutes. */
const SHORT_CACHE = {
  "Cache-Control": "public, max-age=300",
  "CDN-Cache-Control": "public, max-age=300",
  "Vercel-CDN-Cache-Control": "public, max-age=300",
};

/**
 * The social share card of one product photo (lib/share-image/share-image.lib.ts):
 * `/api/share-image/<bucket>/<path>`, our own public storage object cropped to
 * 1200×630 JPEG with sharp, instead of Supabase image transformations. Only an
 * allow-listed bucket and a strictly checked relative path are fetched, on our
 * own Supabase project: never a URL from the request. Any failure redirects to
 * the original object, so the link preview still shows the photo.
 */
export async function GET(request: Request, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  const { bucket, path: segments } = await params;
  const path = segments.join("/");
  const origin = ownStorageOrigin();
  // Our share URLs never carry a query; one would only make a new CDN cache key (a fresh fetch and render per request).
  const hasQuery = new URL(request.url).search !== "";
  if (hasQuery || !origin || !isShareImageBucket(bucket) || !isValidShareImagePath(path)) {
    return new Response("Not found", { status: 404, headers: SHORT_CACHE });
  }

  const original = storageObjectUrl(origin, bucket, path);
  const fallback = (reason: string, error?: unknown) => {
    logServerError("image", "share image fell back to the original", { bucket, path, reason }, error);
    return new Response(null, { status: 302, headers: { Location: original, ...SHORT_CACHE } });
  };

  const fetched = await fetchOriginalImage(original);
  if (!fetched.ok) return fallback(fetched.status ? `${fetched.reason}:${fetched.status}` : fetched.reason);

  let jpeg: Buffer;
  try {
    jpeg = await renderShareImage(fetched.bytes);
  } catch (error) {
    return fallback("render", error);
  }
  return new Response(new Uint8Array(jpeg), {
    status: 200,
    headers: { "Content-Type": SHARE_IMAGE_TYPE, "Content-Length": String(jpeg.byteLength), ...LONG_CACHE },
  });
}
