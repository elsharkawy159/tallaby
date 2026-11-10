"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The store the Products pages are showing (ROADMAP.md F-87c slice 1). Every
 * product action takes it as an explicit `storeId` and the server checks it
 * against the session (requireProductStore); this value is never trusted.
 * Until the route moves to /stores/[storeId]/products (slice 2) it is the
 * sidebar's selected store, set by products/layout.tsx.
 */
const ProductStoreContext = createContext<string>("");

export function ProductStoreProvider({ storeId, children }: { storeId: string; children: ReactNode }) {
  return <ProductStoreContext.Provider value={storeId}>{children}</ProductStoreContext.Provider>;
}

/** The page's store id, or "" outside the Products pages (the server then refuses with not_found). */
export function useProductStoreId(): string {
  return useContext(ProductStoreContext);
}
