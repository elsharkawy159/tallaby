"use client";

import { StoreEditor, type EditorAssistant, type EditorInitial } from "@workspace/store-editor/editor.client";
import { useSellerEditorAdapter } from "./seller-adapter.client";

/**
 * The website editor for one of the seller's stores, on the seller's server
 * actions. `aiEditor`: editing with AI is on, so the top bar offers the other
 * editor. `assistant`: the AI layout's chat (`ai/`); without it this is the
 * manual editor.
 */
export function SellerEditor({
  initial,
  codeSections = false,
  editorAgent = false,
  aiEditor = false,
  assistant,
}: {
  initial: EditorInitial;
  codeSections?: boolean;
  editorAgent?: boolean;
  aiEditor?: boolean;
  assistant?: EditorAssistant;
}) {
  const adapter = useSellerEditorAdapter(initial.storeId, undefined, codeSections, editorAgent, aiEditor);
  return <StoreEditor initial={initial} adapter={adapter} assistant={assistant} />;
}
