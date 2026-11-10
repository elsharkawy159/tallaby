"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/**
 * The store the Products pages are showing (ROADMAP.md F-87c). Every product
 * action takes it as an explicit `storeId` and the server checks it against
 * the session (requireProductStore); this value is never trusted. It is the
 * `/stores/[storeId]/products` segment, set by products/layout.tsx once
 * loadStorePage has checked the store against the session.
 */
const ProductStoreContext = createContext<string>("");

export function ProductStoreProvider({ storeId, children }: { storeId: string; children: ReactNode }) {
  return <ProductStoreContext.Provider value={storeId}>{children}</ProductStoreContext.Provider>;
}

/** The page's store id, or "" outside the Products pages (the server then refuses with not_found). */
export function useProductStoreId(): string {
  return useContext(ProductStoreContext);
}

/** Builds links inside this store's Products pages: `href("/add")` → `/stores/<id>/products/add`. */
export function useProductsHref(): (sub?: string) => string {
  const storeId = useProductStoreId();
  return useCallback((sub = "") => storeProductsHref(storeId, sub), [storeId]);
}
