"use client";

import { useMemo, type ComponentProps, type ReactNode } from "react";
import { MEDIA_BUCKET } from "@workspace/lib/media";
import { EditorAdapterProvider, type EditorAdapter } from "@workspace/store-editor";
import { MediaLibrary as PackageMediaLibrary } from "@workspace/store-editor/media/media-library.client";
import { MediaPicker as PackageMediaPicker } from "@workspace/store-editor/media/media-picker.client";
import { uploadOwnFolderFile } from "@/components/inputs/use-seller-upload";
import { createFolder, createUploadPaths, deleteFolder, deleteMedia, listMedia, recordUpload, renameFolder, updateMedia } from "./media.server";

/**
 * The media library UI lives in @workspace/store-editor and reaches the
 * server through an EditorAdapter. These wrappers give the dashboard's own
 * pages (Website › Media, the blog editor) the seller's media actions for one
 * store; the website editor gets the same `media` group from its seller adapter.
 */
export function sellerMediaAdapter(storeId: string): EditorAdapter["media"] {
  return {
    list: (query) => listMedia(storeId, query),
    createUploadPaths: (input) => createUploadPaths(storeId, input),
    // Signed by the server for a path in the seller's own `store-media` folder (the browser has no readable session).
    uploadFile: async (path, file) => {
      await uploadOwnFolderFile(file, { bucket: MEDIA_BUCKET, path, cacheControl: "31536000" });
    },
    recordUpload: (input) => recordUpload(storeId, input),
    update: (assetId, input) => updateMedia(storeId, assetId, input),
    remove: (assetId) => deleteMedia(storeId, assetId),
    createFolder: (input) => createFolder(storeId, input),
    renameFolder: (folderId, name) => renameFolder(storeId, folderId, name),
    deleteFolder: (folderId) => deleteFolder(storeId, folderId),
  };
}

const notAvailable = async () => ({ success: false as const, error: "notFound" as const });

/** An adapter with only the media group (everything else is off and fails as not found). */
function mediaOnlyAdapter(storeId: string): EditorAdapter {
  return {
    capabilities: {
      pages: false,
      templates: false,
      forms: false,
      explore: false,
      mediaLibrary: true,
      revisions: false,
      unpublish: false,
      preview: false,
      industrySwitcher: false,
      designSystem: true,
      publishLabel: "site",
    },
    saveDraft: notAvailable,
    saveDesignSystem: notAvailable,
    saveChrome: notAvailable,
    refreshData: notAvailable,
    publish: notAvailable,
    media: sellerMediaAdapter(storeId),
  };
}

export function MediaAdapterProvider({ storeId, children }: { storeId: string; children: ReactNode }) {
  const adapter = useMemo(() => mediaOnlyAdapter(storeId), [storeId]);
  return <EditorAdapterProvider adapter={adapter}>{children}</EditorAdapterProvider>;
}

/** The store's media library (Website › Media). */
export function MediaLibrary({ storeId, ...props }: { storeId: string } & ComponentProps<typeof PackageMediaLibrary>) {
  return (
    <MediaAdapterProvider storeId={storeId}>
      <PackageMediaLibrary {...props} />
    </MediaAdapterProvider>
  );
}

/** "Choose from library" button + dialog for one store's media. */
export function MediaPicker({ storeId, ...props }: { storeId: string } & ComponentProps<typeof PackageMediaPicker>) {
  return (
    <MediaAdapterProvider storeId={storeId}>
      <PackageMediaPicker {...props} />
    </MediaAdapterProvider>
  );
}
