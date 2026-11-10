import type { ReactNode } from "react";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { ProductStoreProvider } from "./_components/product-store.client";

/**
 * Gives every Products page the store it acts on (ROADMAP.md F-87c slice 1):
 * the sidebar's selected store, which getSellerStores only ever picks from the
 * session seller's own stores. Actions still check it on the server; slice 2
 * replaces this with the [storeId] route segment.
 */
export default async function ProductsLayout({ children }: { children: ReactNode }) {
  const { selected } = await getSellerStores();
  return <ProductStoreProvider storeId={selected?.id ?? ""}>{children}</ProductStoreProvider>;
}
