/**
 * Paths in the public `library-media` bucket (0086): images an admin uploads
 * into library sections and templates (Task 11; Task 15 reuses it). Same
 * raster-only MIME list as store media (no SVG on a public bucket). Pure.
 */
import { MEDIA_MIME_TYPES, isMediaMimeType, mediaExtension } from "@workspace/lib/media";

export const LIBRARY_MEDIA_BUCKET = "library-media";

const PATH_RE = /^library\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([a-z0-9]+)$/;

/** `library/<uuid>.<ext>` for an allowed image type, else null. */
export function libraryMediaPath(mime: unknown, objectId: string = globalThis.crypto.randomUUID()): string | null {
  if (!isMediaMimeType(mime)) return null;
  const ext = mediaExtension(mime);
  return ext ? `library/${objectId.toLowerCase()}.${ext}` : null;
}

const extensionOf = (path: string) => PATH_RE.exec(path)?.[2] ?? null;

const ALLOWED_EXTENSIONS = new Set(Object.values(MEDIA_MIME_TYPES).flat() as string[]);

/** A path `libraryMediaPath` could have made (no traversal, a known image extension). */
export function isLibraryMediaPath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  const ext = extensionOf(path);
  return ext !== null && ALLOWED_EXTENSIONS.has(ext);
}

/** The stored object's MIME type fits the path's extension. */
export function mimeMatchesLibraryPath(mime: unknown, path: string): boolean {
  if (!isMediaMimeType(mime)) return false;
  const ext = extensionOf(path);
  return ext !== null && (MEDIA_MIME_TYPES[mime] as readonly string[]).includes(ext);
}

export function libraryMediaUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${LIBRARY_MEDIA_BUCKET}/${path}`;
}
