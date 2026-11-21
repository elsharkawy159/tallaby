/**
 * Which seller photos the dashboard takes for product images, and how. Pure, so
 * it is unit tested; the canvas work lives in `prepare-image.client.ts`.
 *
 * - "keep": stored as it is. Every browser shows these, and so do Supabase image
 *   transforms (`/storage/v1/render/image/…`) the storefront uses.
 * - "convert": re-encoded to JPEG in the browser first (most browsers can't show
 *   HEIC/HEIF, BMP or TIFF). Any other `image/*` the browser can decode too.
 * - "reject": not an image, or SVG (it can carry scripts, CLAUDE.md rule 9).
 */

/** Stored as they are, with the extensions each one may carry. */
const KEEP_TYPES: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg", "jfif", "pjpeg", "pjp"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/avif": ["avif"],
};

/** Converted to JPEG. HEIC/HEIF often arrive with an empty type, so the extension counts too. */
const CONVERT_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/bmp",
  "image/x-ms-bmp",
  "image/tiff",
]);
const CONVERT_EXTENSIONS = new Set(["heic", "heif", "bmp", "tif", "tiff"]);

const SVG_TYPES = new Set(["image/svg+xml", "image/svg"]);
const SVG_EXTENSIONS = new Set(["svg", "svgz"]);

export type ImageFormatDecision =
  /** `type` is the MIME type to store it with (filled in when the browser gave none). */
  | { kind: "keep"; type: string }
  | { kind: "convert" }
  | { kind: "reject" }

/** The lower-case extension of a file name, without the dot ("" when it has none). */
export function fileExtension (name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
}

function keepTypeForExtension (extension: string): string | null {
  for (const [type, extensions] of Object.entries(KEEP_TYPES)) {
    if (extensions.includes(extension)) return type;
  }
  return null;
}

export function classifyImageFile ({ name, type }: { name: string; type: string }): ImageFormatDecision {
  const mime = (type || "").toLowerCase().trim();
  const extension = fileExtension(name || "");

  if (SVG_TYPES.has(mime) || SVG_EXTENSIONS.has(extension)) return { kind: "reject" };
  if (KEEP_TYPES[mime]) return { kind: "keep", type: mime };
  if (CONVERT_TYPES.has(mime)) return { kind: "convert" };

  if (!mime || mime === "application/octet-stream") {
    // No type from the browser (common for HEIC): trust a known extension only.
    const keepType = keepTypeForExtension(extension);
    if (keepType) return { kind: "keep", type: keepType };
    if (CONVERT_EXTENSIONS.has(extension)) return { kind: "convert" };
    return { kind: "reject" };
  }

  // Any other image the browser may decode (the canvas step reports it when it can't).
  if (mime.startsWith("image/")) return { kind: "convert" };
  return { kind: "reject" };
}

/** The name to store a kept file under: its own when its extension fits the type, else `<base>.<ext>`. */
export function keptFileName (name: string, type: string): string {
  const extensions = KEEP_TYPES[type];
  if (!extensions) return name;
  if (extensions.includes(fileExtension(name))) return name;
  return replaceExtension(name, extensions[0]!);
}

/** `photo.heic` → `photo.jpg`; a name with no base becomes `photo.<ext>`. */
export function replaceExtension (name: string, extension: string): string {
  const base = fileExtension(name) ? name.slice(0, name.lastIndexOf(".")) : name;
  return `${base.trim() || "photo"}.${extension}`;
}

/**
 * The react-dropzone `accept` for product photos. `image/*` lets every image
 * reach the check above (so SVG gets a clear error instead of vanishing), and
 * the extensions let HEIC files with an empty type through.
 */
export const PRODUCT_IMAGE_ACCEPT: Record<string, string[]> = {
  "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif", ".bmp", ".tif", ".tiff"],
};

/** The same list for a plain `<input type="file" accept>`. */
export const PRODUCT_IMAGE_ACCEPT_ATTR = Object.entries(PRODUCT_IMAGE_ACCEPT)
  .flatMap(([type, extensions]) => [type, ...extensions])
  .join(",");

/** True when the file is a photo the product uploaders take (kept or converted). */
export const isAcceptedImageFile = (file: { name: string; type: string }) =>
  classifyImageFile(file).kind !== "reject";
