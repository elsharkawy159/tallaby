import type { MediaAltText } from "@workspace/lib/media";

/** One file in the library, as the browser sees it. */
export type MediaAssetView = {
  id: string;
  /** null = shared by all of the seller's stores. */
  storeId: string | null;
  folderId: string | null;
  storagePath: string;
  url: string;
  filename: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: MediaAltText;
  createdAt: string;
  /** Places in this store's draft site that use the file. */
  usage: number;
};

export type MediaFolderView = {
  id: string;
  name: string;
  parentId: string | null;
  storeId: string | null;
};

export type MediaLibraryView = { folders: MediaFolderView[]; assets: MediaAssetView[] };

/** Error keys live under `mediaLibrary.errors`. */
export type MediaErrorKey =
  | "notFound"
  | "readOnly"
  | "invalidInput"
  | "invalidPath"
  | "objectMissing"
  | "tooLarge"
  | "invalidType"
  | "invalidFolder"
  | "tooMany"
  | "rateLimited"
  | "deleteFailed"
  | "generic";

export type MediaResult<T> = { success: true; data: T } | { success: false; error: MediaErrorKey };

/** lib error codes → message keys. */
export const MEDIA_ERRORS: Record<string, MediaErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  invalid_input: "invalidInput",
  invalid_path: "invalidPath",
  foreign_path: "invalidPath",
  wrong_store: "invalidPath",
  object_missing: "objectMissing",
  too_large: "tooLarge",
  invalid_type: "invalidType",
  invalid_folder: "invalidFolder",
  too_many: "tooMany",
};
