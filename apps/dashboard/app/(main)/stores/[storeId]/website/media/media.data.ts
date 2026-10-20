import { countMediaUsage, listMediaLibrary } from "@workspace/lib/media/server";
import { toAssetView, toFolderView } from "@workspace/store-editor/media/media.lib";
import type { MediaLibraryView } from "@workspace/store-editor/editor.dto";

/** The library root for the page's first render. Never cached (seller data). */
export async function loadMediaLibrary(sellerId: string, storeId: string): Promise<MediaLibraryView | null> {
  const library = await listMediaLibrary(sellerId, storeId, { folderId: null, scope: "all" });
  if (!library) return null;
  const usage = await countMediaUsage(sellerId, storeId, library.assets.map((a) => a.storagePath));
  return {
    folders: library.folders.map(toFolderView),
    assets: library.assets.map((a) => toAssetView(a, usage[a.storagePath] ?? 0)),
  };
}
