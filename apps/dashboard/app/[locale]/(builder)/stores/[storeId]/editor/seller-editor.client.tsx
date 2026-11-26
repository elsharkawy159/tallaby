"use client";

import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { useSellerEditorAdapter } from "./seller-adapter.client";

/** The website editor for one of the seller's stores, on the seller's server actions. */
export function SellerEditor({ initial, codeSections = false }: { initial: EditorInitial; codeSections?: boolean }) {
  const adapter = useSellerEditorAdapter(initial.storeId, undefined, codeSections);
  return <StoreEditor initial={initial} adapter={adapter} />;
}
