/**
 * Digital product files (ROADMAP.md F-108a): what a seller may upload, how big,
 * how many, and where it is stored. Shared by the product form (browser) and
 * the server actions, so both apply the same rules.
 *
 * Files live in the private `digital-products` bucket (0189) at
 * `<sellerId>/<storeId>/<uuid>-<safe name>`. The type is checked by file
 * extension, not MIME type: DXF, DWG and PLT files have no reliable one.
 */

/** Same value as `DIGITAL_PRODUCTS_BUCKET` in `@workspace/db/supabase/service` (that module is server-only). */
export const DIGITAL_FILES_BUCKET = "digital-products";

export const DIGITAL_FILE_MAX_BYTES = 100 * 1024 * 1024;
export const DIGITAL_FILES_MAX = 10;

export const DIGITAL_FILE_EXTENSIONS = [
  // Documents and books
  "pdf", "epub", "txt", "md", "csv", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  // CAD, cutting and design files
  "dxf", "dwg", "plt", "svg", "ai", "eps", "psd",
  // Images
  "png", "jpg", "jpeg", "webp", "gif",
  // Audio
  "mp3", "wav", "m4a", "ogg", "flac",
  // Video
  "mp4", "mov", "webm", "mkv",
  // Archives
  "zip", "rar", "7z",
] as const;

export type DigitalFileExtension = (typeof DIGITAL_FILE_EXTENSIONS)[number];

const EXTENSIONS = new Set<string>(DIGITAL_FILE_EXTENSIONS);

/** The file picker's `accept` attribute. */
export const DIGITAL_FILE_ACCEPT = DIGITAL_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/** A file name's extension in lower case when it is one we accept, else null. */
export function digitalFileExtension(name: string): DigitalFileExtension | null {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(String(name ?? "").trim());
  const ext = match?.[1]?.toLowerCase();
  return ext && EXTENSIONS.has(ext) ? (ext as DigitalFileExtension) : null;
}

export type DigitalFileProblem = "type" | "size" | "empty";

/** Why a file can't be uploaded, or null when it can. */
export function digitalFileProblem(file: { name: string; size: number }): DigitalFileProblem | null {
  if (!digitalFileExtension(file.name)) return "type";
  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) return "empty";
  if (size > DIGITAL_FILE_MAX_BYTES) return "size";
  return null;
}

const NAME_MAX = 80;

/**
 * A storage-safe version of a file name: Latin letters, digits, `.`, `-` and
 * `_` only, at most 80 characters before the extension. The real name is kept
 * in `digital_files.file_name`; this is only for the storage path.
 */
export function sanitizeDigitalFileName(name: string): string {
  const ext = digitalFileExtension(name) ?? "bin";
  const base = String(name ?? "")
    .trim()
    .replace(/\.[A-Za-z0-9]{1,8}$/, "")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, NAME_MAX);
  return `${base || "file"}.${ext}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The storage path for a new upload, or null when an id is not a UUID. */
export function buildDigitalFilePath(sellerId: string, storeId: string, fileId: string, name: string): string | null {
  const seller = String(sellerId ?? "").toLowerCase();
  const store = String(storeId ?? "").toLowerCase();
  const id = String(fileId ?? "").toLowerCase();
  if (!UUID_RE.test(seller) || !UUID_RE.test(store) || !UUID_RE.test(id)) return null;
  return `${seller}/${store}/${id}-${sanitizeDigitalFileName(name)}`;
}

const PATH_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[A-Za-z0-9._-]{1,120}$/;

/**
 * True only for a path this seller's store could have been given by
 * `createDigitalFileUploadUrl`: `<sellerId>/<storeId>/<uuid>-<safe name>`
 * with an accepted extension. Never trust a client path without it.
 */
export function isOwnDigitalFilePath(sellerId: string, storeId: string, path: string): boolean {
  const value = String(path ?? "");
  if (value.length > 300 || value.includes("..")) return false;
  const match = PATH_RE.exec(value);
  if (!match) return false;
  if (match[1] !== String(sellerId ?? "").toLowerCase() || match[2] !== String(storeId ?? "").toLowerCase()) return false;
  return digitalFileExtension(value) !== null;
}

/** "12.5 MB"-style size with Latin digits (file sizes read the same in both languages). */
export function formatDigitalFileSize(bytes: number): string {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  const mb = size / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
