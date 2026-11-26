"use client";

import { createContext, use, useCallback, useContext, type ReactNode } from "react";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/**
 * The store the Products pages are showing (ROADMAP.md F-87c). Every product
 * action takes it as an explicit `storeId` and the server checks it against
 * the session (requireProductStore); this value is never trusted. It is the
 * `/stores/[storeId]/products` segment, handed down by products/layout.tsx as
 * a promise so the layout never blocks its pages (docs/plans/dashboard-performance.md
 * B4); each page checks the store itself (loadProductStorePage: a foreign,
 * deleted or forged store is a 404). Other providers pass a plain string.
 */
const ProductStoreContext = createContext<string | Promise<string>>("");

export function ProductStoreProvider({ storeId, children }: { storeId: string | Promise<string>; children: ReactNode }) {
  return <ProductStoreContext.Provider value={storeId}>{children}</ProductStoreContext.Provider>;
}

/**
 * The page's store id, or "" outside the Products pages (the server then refuses with not_found).
 * Under the Products layout it unwraps the segment promise, so it suspends until the route's
 * params are known: callers sit under the pages' `loading.tsx` / `<Suspense>`.
 */
export function useProductStoreId(): string {
  const value = useContext(ProductStoreContext);
  return typeof value === "string" ? value : use(value);
}

/** Builds links inside this store's Products pages: `href("/add")` → `/stores/<id>/products/add`. */
export function useProductsHref(): (sub?: string) => string {
  const storeId = useProductStoreId();
  return useCallback((sub = "") => storeProductsHref(storeId, sub), [storeId]);
}
