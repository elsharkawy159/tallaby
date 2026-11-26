/**
 * Pure rules of the "Edit with AI" page (owner request 2026-11-26).
 */

/** What /stores/[storeId]/editor/ai does: 404 without the website builder, the manual editor with AI off, else the chat. */
export function editWithAiGate({ builderEnabled, aiEnabled }: { builderEnabled: boolean; aiEnabled: boolean }): "notFound" | "editor" | "show" {
  if (!builderEnabled) return "notFound";
  return aiEnabled ? "show" : "editor";
}

export type PreviewDevice = "desktop" | "mobile";

/** The preview frame's width for a device; desktop fills the pane. */
export const PREVIEW_WIDTH: Record<PreviewDevice, number | null> = { desktop: null, mobile: 390 };

/** The Publish button: only with unpublished changes, never while publishing or for a read-only store. */
export function canPublish({ hasUnpublishedChanges, publishing, readOnly }: { hasUnpublishedChanges: boolean; publishing: boolean; readOnly: boolean }): boolean {
  return hasUnpublishedChanges && !publishing && !readOnly;
}

/** Editor publish errors this page explains in its own words; anything else is the generic one. */
const PUBLISH_ERRORS = new Set(["noActiveProduct", "topUpRequired", "templateNotChosen", "nothingToPublish", "rateLimited", "readOnly", "publishBlocked", "invalidSite"]);
export const publishErrorKey = (error: string) => (PUBLISH_ERRORS.has(error) ? error : "generic");
