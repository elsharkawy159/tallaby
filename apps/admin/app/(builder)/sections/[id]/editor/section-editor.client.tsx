"use client";

import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { useSectionAdapter } from "./section-adapter.client";

/**
 * Opens the library section editor straight away (owner, 2026-10-24: no
 * reason prompt); Publish is audited with ADMIN_DEFAULT_REASON (draft saves
 * are not audited).
 */
export function SectionEditorGate({ initial }: { initial: EditorInitial; sectionName: string }) {
  const adapter = useSectionAdapter(initial.storeId, ADMIN_DEFAULT_REASON, initial.catalog);
  return <StoreEditor initial={initial} adapter={adapter} />;
}
