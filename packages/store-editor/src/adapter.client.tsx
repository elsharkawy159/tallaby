"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EditorAdapter } from "./adapter.types";

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
