"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { EditorAdapter } from "./adapter.types";
import { resolveEditorLinks, type EditorLinks } from "./lib/editor-links.lib";

const EditorAdapterContext = createContext<EditorAdapter | null>(null);

export function EditorAdapterProvider({ adapter, children }: { adapter: EditorAdapter; children: ReactNode }) {
  return <EditorAdapterContext.Provider value={adapter}>{children}</EditorAdapterContext.Provider>;
}

/** The host's adapter (seller dashboard, admin, template or section editor). Throws outside a provider. */
export function useEditorAdapter(): EditorAdapter {
  const adapter = useContext(EditorAdapterContext);
  if (!adapter) throw new Error("EditorAdapterProvider missing");
  return adapter;
}

/** The host's links for this store: the dashboard's pages unless the adapter overrides them (null = hidden). */
export function useEditorLinks(storeId: string): EditorLinks {
  const links = useEditorAdapter().links;
  return useMemo(() => resolveEditorLinks(storeId, links), [storeId, links]);
}
