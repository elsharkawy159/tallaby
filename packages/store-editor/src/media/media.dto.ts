import type { MediaErrorKey } from "../editor.dto";

export type { MediaAssetView, MediaErrorKey, MediaFolderView, MediaLibraryView, MediaResult } from "../editor.dto";

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
