import { mediaPublicUrl } from "@workspace/lib/media";
import type { MediaAssetRow, MediaFolderRow } from "@workspace/lib/media/server";
import type { MediaAssetView, MediaFolderView } from "./media.dto";

export function toAssetView(row: MediaAssetRow, usage: number): MediaAssetView {
  return {
    id: row.id,
    storeId: row.storeId,
    folderId: row.folderId,
    storagePath: row.storagePath,
    url: mediaPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", row.storagePath),
    filename: row.filename,
    mimeType: row.mimeType,
    bytes: Number(row.bytes),
    width: row.width,
    height: row.height,
    altText: row.altText,
    createdAt: row.createdAt,
    usage,
  };
}

export function toFolderView(row: MediaFolderRow): MediaFolderView {
  return { id: row.id, name: row.name, parentId: row.parentId, storeId: row.storeId };
}

/** Root → folder chain for the breadcrumb (stops on a missing parent or a cycle). */
export function folderTrail(folders: MediaFolderView[], folderId: string | null): MediaFolderView[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const trail: MediaFolderView[] = [];
  let current = folderId ? byId.get(folderId) : undefined;
  while (current && !trail.includes(current)) {
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return trail;
}

export function formatBytes(bytes: number, locale: string): string {
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat(locale === "en" ? "en" : "ar-EG", { maximumFractionDigits: unit ? 1 : 0 }).format(value)} ${units[unit]}`;
}
