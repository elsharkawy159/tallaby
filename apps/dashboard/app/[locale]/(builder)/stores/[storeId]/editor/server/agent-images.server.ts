import { and, db, eq, inArray, isNull, mediaAssets, or } from "@workspace/db";
import { MEDIA_BUCKET, checkMediaPath, mediaAlt, mediaPublicUrl, parseMediaPath } from "@workspace/lib/media";

/**
 * Photos the AI agents may put on a store's website with `set_image` (the
 * website editor's agent, F-83c, and Edit with AI): only the store's own
 * media library (`store-media`, the seller's folder, this store or shared).
 * Server only: the check reads `media_assets`, never trusts a client path.
 */

export const MAX_AGENT_MEDIA_REFS = 8;

const supabaseUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");

/** The store-media path of a public media URL of this project, or of a bare path; null for anything else. */
export function mediaPathOf(src: string, base = supabaseUrl()): string | null {
  const value = src.trim();
  if (parseMediaPath(value)) return value;
  const prefix = base ? `${base}/storage/v1/object/public/${MEDIA_BUCKET}/` : null;
  if (!prefix || !value.startsWith(prefix)) return null;
  const rest = value.slice(prefix.length).split(/[?#]/)[0]!;
  return parseMediaPath(rest) ? rest : null;
}

const REF_RE = /https?:\/\/[^\s"'<>]+|[0-9a-f]{8}-[0-9a-f-]{27}\/(?:[0-9a-f]{8}-[0-9a-f-]{27}|shared)\/[0-9a-f]{8}-[0-9a-f-]{27}\.(?:jpe?g|png|webp|gif|avif)/gi;

/** Store-media paths named in a text (a seller pasting a link from the media library), at most `MAX_AGENT_MEDIA_REFS`. */
export function mediaPathsIn(text: string): string[] {
  const out = new Set<string>();
  for (const match of text.slice(0, 4000).matchAll(REF_RE)) {
    const path = mediaPathOf(match[0]);
    if (path) out.add(path);
    if (out.size >= MAX_AGENT_MEDIA_REFS) break;
  }
  return [...out];
}

export type AgentMediaImage = { path: string; src: string; label: string };

/** The seller's recorded media rows among these paths (this store's or shared), as public URLs. Never another seller's or store's. */
export async function ownMediaImages(sellerId: string, storeId: string, paths: readonly string[]): Promise<AgentMediaImage[]> {
  const own = [...new Set(paths)].filter((path) => checkMediaPath(path, sellerId, storeId) === null).slice(0, MAX_AGENT_MEDIA_REFS);
  if (!own.length) return [];
  const rows = await db
    .select({ storagePath: mediaAssets.storagePath, filename: mediaAssets.filename, altText: mediaAssets.altText })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.sellerId, sellerId),
        eq(mediaAssets.bucket, MEDIA_BUCKET),
        inArray(mediaAssets.storagePath, own),
        or(eq(mediaAssets.storeId, storeId), isNull(mediaAssets.storeId)),
      ),
    );
  const base = supabaseUrl();
  return rows.map((row) => ({
    path: row.storagePath,
    src: mediaPublicUrl(base, row.storagePath),
    label: (mediaAlt(row.altText, "en") || mediaAlt(row.altText, "ar") || row.filename).slice(0, 80),
  }));
}

/** `allowImage` for `applySectionOps`: a listed photo, by its URL or path, stored as its public URL. */
export function mediaImageCheck(images: readonly AgentMediaImage[]): (src: string) => string | null {
  const byPath = new Map(images.map((image) => [image.path, image.src]));
  return (src) => {
    const path = mediaPathOf(src);
    return path ? (byPath.get(path) ?? null) : null;
  };
}
