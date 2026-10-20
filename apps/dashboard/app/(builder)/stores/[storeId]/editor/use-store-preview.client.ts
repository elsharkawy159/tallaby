"use client";

import { useStorePreview as usePreviewLink } from "@workspace/store-editor/state/use-store-preview.client";
import { previewLink } from "./server/editor.server";

/** "Preview on my store" for the Website overview, on the seller's preview-link action. */
export function useStorePreview(storeId: string, beforeOpen?: () => Promise<boolean>) {
  return usePreviewLink(() => previewLink(storeId), beforeOpen);
}
