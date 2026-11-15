/**
 * Where a seller's document scans live in the public `sellers` bucket, and
 * the check that a document URL sent by the browser points into the session
 * seller's own folder (never another seller's file, another bucket or an
 * outside link). Pure, so it is unit-tested.
 */

export const SELLER_DOCUMENTS_BUCKET = "sellers";

/** `documents/<sellerId>`: the folder `useSellerUpload` writes a document into. */
export function sellerDocumentsFolder(sellerId: string): string {
  return `documents/${sellerId.toLowerCase()}`;
}

// `<Date.now()>-<slug>.<ext>`, the name `generateImageName` makes (slug is lower-case and strict).
const FILE_NAME_RE = /^\d{10,16}-[a-z0-9-]{0,200}\.[A-Za-z0-9]{1,16}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True only for `<supabaseUrl>/storage/v1/object/public/sellers/documents/<sellerId>/<file>`
 * with a plain file name: no `..`, no encoded characters, no query or hash.
 */
export function isOwnSellerDocumentUrl(sellerId: string, fileUrl: string, supabaseUrl: string): boolean {
  if (typeof sellerId !== "string" || !UUID_RE.test(sellerId)) return false;
  if (typeof fileUrl !== "string" || fileUrl.length > 1024) return false;
  // Refuse anything URL parsing would rewrite (dot segments, escapes, backslashes).
  if (fileUrl.includes("..") || fileUrl.includes("%") || fileUrl.includes("\\")) return false;

  let url: URL;
  let base: URL;
  try {
    url = new URL(fileUrl);
    base = new URL(supabaseUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && base.protocol === "http:")) return false;
  if (url.origin !== base.origin || url.username || url.password || url.search || url.hash) return false;

  const prefix = `/storage/v1/object/public/${SELLER_DOCUMENTS_BUCKET}/${sellerDocumentsFolder(sellerId)}/`;
  if (!url.pathname.startsWith(prefix)) return false;
  return FILE_NAME_RE.test(url.pathname.slice(prefix.length));
}
