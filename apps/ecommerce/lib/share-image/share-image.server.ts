import sharp from "sharp";
import { SHARE_IMAGE_SIZE } from "./share-image.lib";

/** The largest original the route downloads (seller uploads are usually well under this). */
export const SHARE_IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const SHARE_IMAGE_FETCH_TIMEOUT_MS = 10_000;
/** About 40 megapixels: a decoded image beyond this is refused (decompression bombs). */
const MAX_INPUT_PIXELS = 40_000_000;

// One render per request; keeping decoded images in sharp's cache only costs memory.
sharp.cache(false);

export type FetchOriginalResult =
  | { ok: true; bytes: Buffer }
  | { ok: false; reason: "status" | "type" | "too_large" | "network"; status?: number };

/**
 * Downloads one original object. No redirects are followed, SVG and non-image
 * types are refused, and the body is capped by its Content-Length and again
 * while it is read.
 */
export async function fetchOriginalImage(url: string, fetchImpl: typeof fetch = fetch): Promise<FetchOriginalResult> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(SHARE_IMAGE_FETCH_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "network" };
  }
  if (!res.ok || !res.body) {
    await res.body?.cancel().catch(() => {});
    return { ok: false, reason: "status", status: res.status };
  }
  const type = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!type.startsWith("image/") || type === "image/svg+xml") {
    await res.body.cancel().catch(() => {});
    return { ok: false, reason: "type" };
  }
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > SHARE_IMAGE_MAX_BYTES) {
    await res.body.cancel().catch(() => {});
    return { ok: false, reason: "too_large" };
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > SHARE_IMAGE_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "network" };
  }
  return { ok: true, bytes: Buffer.concat(chunks, total) };
}

/**
 * The 1200×630 share card: turned upright by its EXIF orientation, cropped
 * from the centre (`cover`, as Supabase's `resize=cover` did), transparency on
 * white, progressive mozjpeg at quality 80, with no metadata kept.
 */
export async function renderShareImage(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
    .rotate()
    .resize(SHARE_IMAGE_SIZE.width, SHARE_IMAGE_SIZE.height, { fit: "cover", position: "centre" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toBuffer();
}
