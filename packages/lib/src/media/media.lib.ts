/**
 * Pure media-library rules (PLAN.md §11.5, P4-09), shared by the dashboard
 * (browser upload + server actions) and the server data access. No database
 * imports.
 *
 * Objects live in the public `store-media` bucket at
 *   '{sellerId}/{storeId | "shared"}/{uuid}.{ext}'
 * The browser uploads straight to Storage (the bucket policies only allow the
 * caller's own '{auth.uid()}/' folder); a server action then records the
 * media_assets row after checking the path against the session's seller and
 * store, plus the object's real size and type.
 */
import { z } from "zod";

export const MEDIA_BUCKET = "store-media";

/** Same as the bucket's file_size_limit (0053). */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

/** Abuse guards per seller account (not a plan limit). */
export const MEDIA_MAX_ASSETS_PER_SELLER = 2000;
export const MEDIA_MAX_FOLDERS_PER_SELLER = 200;
/** Items one library listing returns (newest first). */
export const MEDIA_LIST_LIMIT = 500;

/**
 * Raster images only, matching the bucket's allowed_mime_types. No SVG: a
 * public bucket would serve seller-supplied SVG, which can carry script.
 */
export const MEDIA_MIME_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/avif": ["avif"],
} as const satisfies Record<string, readonly string[]>;

export type MediaMimeType = keyof typeof MEDIA_MIME_TYPES;

/** For `<input accept>` and react-dropzone. */
export const MEDIA_ACCEPT: Record<string, string[]> = Object.fromEntries(
  Object.entries(MEDIA_MIME_TYPES).map(([mime, exts]) => [mime, exts.map((e) => `.${e}`)]),
);
export const MEDIA_ACCEPT_ATTR = Object.keys(MEDIA_MIME_TYPES).join(",");

export const SHARED_SCOPE = "shared";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_RE = new RegExp(`^${UUID}$`);
const PATH_RE = new RegExp(`^(${UUID})/(${UUID}|${SHARED_SCOPE})/(${UUID})\\.(jpg|jpeg|png|webp|gif|avif)$`);

export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

export function isMediaMimeType(value: unknown): value is MediaMimeType {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MEDIA_MIME_TYPES, value);
}

/** The canonical extension for an allowed type, or null. */
export function mediaExtension(mime: string): string | null {
  return isMediaMimeType(mime) ? MEDIA_MIME_TYPES[mime][0] : null;
}

export type ParsedMediaPath = {
  sellerId: string;
  /** null = shared by all of the seller's stores. */
  storeId: string | null;
  objectId: string;
  ext: string;
};

/** Splits a store-media object path; null when it is not in the exact format. */
export function parseMediaPath(path: unknown): ParsedMediaPath | null {
  if (typeof path !== "string") return null;
  const m = PATH_RE.exec(path);
  if (!m) return null;
  return { sellerId: m[1]!, storeId: m[2] === SHARED_SCOPE ? null : m[2]!, objectId: m[3]!, ext: m[4]! };
}

/** A fresh object path for an upload (browser or server; uses Web Crypto). */
export function buildMediaPath(sellerId: string, storeId: string | null, mime: string, objectId = globalThis.crypto.randomUUID()): string {
  const ext = mediaExtension(mime);
  if (!ext || !isUuid(sellerId) || (storeId !== null && !isUuid(storeId))) throw new Error("invalid_media_path");
  return `${sellerId}/${storeId ?? SHARED_SCOPE}/${objectId.toLowerCase()}.${ext}`;
}

export type MediaPathProblem = "invalid_path" | "foreign_path" | "wrong_store";

/**
 * Checks an uploaded object's path against the SESSION's seller and the
 * store the action was called for: it must be in the seller's own folder and
 * either 'shared' or that exact store (never another of the seller's stores).
 */
export function checkMediaPath(path: unknown, sellerId: string, storeId: string): MediaPathProblem | null {
  const parsed = parseMediaPath(path);
  if (!parsed) return "invalid_path";
  if (parsed.sellerId !== sellerId.toLowerCase()) return "foreign_path";
  if (parsed.storeId !== null && parsed.storeId !== storeId.toLowerCase()) return "wrong_store";
  return null;
}

/** True when the declared type is allowed and matches the file extension. */
export function mimeMatchesPath(mime: unknown, path: string): boolean {
  const parsed = parseMediaPath(path);
  if (!parsed || !isMediaMimeType(mime)) return false;
  return (MEDIA_MIME_TYPES[mime] as readonly string[]).includes(parsed.ext);
}

/** Public URL of a store-media object (the bucket is public-read). */
export function mediaPublicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const uuid = z.string().regex(UUID_RE);
const altText = z.string().trim().max(250);

export const mediaAltTextSchema = z.object({ ar: altText.optional(), en: altText.optional() }).strict();
export type MediaAltText = z.output<typeof mediaAltTextSchema>;

const dimension = z.number().int().min(1).max(20_000);

export const recordMediaInputSchema = z
  .object({
    storagePath: z.string().max(200),
    filename: z.string().trim().min(1).max(200),
    width: dimension.nullish(),
    height: dimension.nullish(),
    folderId: uuid.nullish(),
    altText: mediaAltTextSchema.optional(),
  })
  .strict();
export type RecordMediaInput = z.input<typeof recordMediaInputSchema>;

export const updateMediaAssetSchema = z
  .object({
    altText: mediaAltTextSchema.optional(),
    // null = move to the library root.
    folderId: uuid.nullable().optional(),
  })
  .strict();
export type UpdateMediaAssetInput = z.input<typeof updateMediaAssetSchema>;

export const mediaFolderInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    parentId: uuid.nullish(),
    // true = shared by all of the seller's stores; false = this store only.
    shared: z.boolean(),
  })
  .strict();
export type MediaFolderInput = z.input<typeof mediaFolderInputSchema>;

export const MEDIA_SCOPES = ["all", "store", "shared"] as const;
export type MediaScope = (typeof MEDIA_SCOPES)[number];

export const mediaListQuerySchema = z
  .object({
    // undefined = every folder; null = the root only.
    folderId: uuid.nullish(),
    scope: z.enum(MEDIA_SCOPES).default("all"),
  })
  .strict();
export type MediaListQuery = z.input<typeof mediaListQuerySchema>;

/** Localized alt text, falling back to the other language. */
export function mediaAlt(alt: unknown, locale: string): string {
  const value = (alt ?? {}) as { ar?: string; en?: string };
  return (locale === "en" ? value.en || value.ar : value.ar || value.en) ?? "";
}
