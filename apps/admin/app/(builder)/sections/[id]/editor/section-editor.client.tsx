"use client";

import { useMemo } from "react";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { useSectionAdapter } from "./section-adapter.client";
import { SectionNav, type SectionNavItem } from "./section-nav.client";

/**
 * Opens the library section editor straight away (owner, 2026-10-24: no
 * reason prompt); Publish is audited with ADMIN_DEFAULT_REASON (draft saves
 * are not audited). Add › Sections lists every library section to switch to.
 */
export function SectionEditorGate({ initial, sections }: { initial: EditorInitial; sectionName: string; sections: SectionNavItem[] }) {
  const base = useSectionAdapter(initial.storeId, ADMIN_DEFAULT_REASON, initial.catalog);
  const adapter = useMemo(() => ({ ...base, sectionsTab: <SectionNav items={sections} currentId={initial.storeId} /> }), [base, sections, initial.storeId]);
  return <StoreEditor initial={initial} adapter={adapter} />;
}
