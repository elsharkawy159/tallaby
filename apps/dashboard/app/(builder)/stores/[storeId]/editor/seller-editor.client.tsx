"use client";

import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { useSellerEditorAdapter } from "./seller-adapter.client";

/** The website editor for one of the seller's stores, on the seller's server actions. */
export function SellerEditor({ initial }: { initial: EditorInitial }) {
  const adapter = useSellerEditorAdapter(initial.storeId);
  return <StoreEditor initial={initial} adapter={adapter} />;
}
