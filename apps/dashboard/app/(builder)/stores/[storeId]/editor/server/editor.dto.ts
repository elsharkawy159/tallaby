/** Error keys live under `storeEditor.errors`. */
export type EditorErrorKey =
  | "notFound"
  | "readOnly"
  | "publishBlocked"
  | "invalidContent"
  | "versionConflict"
  | "invalidSlug"
  | "reservedSlug"
  | "slugTaken"
  | "tooManyPages"
  | "homePage"
  | "notPublished"
  | "invalidSite"
  | "invalidInput"
  | "rateLimited"
  | "previewUnavailable"
  | "generic";

export type EditorResult<T> = { success: true; data: T } | { success: false; error: EditorErrorKey };

/** lib error codes → message keys. */
export const EDITOR_ERRORS: Record<string, EditorErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  publish_blocked: "publishBlocked",
  invalid_content: "invalidContent",
  version_conflict: "versionConflict",
  invalid_slug: "invalidSlug",
  reserved_slug: "reservedSlug",
  slug_taken: "slugTaken",
  too_many_pages: "tooManyPages",
  home_page: "homePage",
  not_published: "notPublished",
  invalid_site: "invalidSite",
  invalid_input: "invalidInput",
};

/** Forms tab row: a store form with its counts (owner request 2026-10-18). */
export type EditorFormSummary = { id: string; fieldCount: number; submissionCount: number; newCount: number };
