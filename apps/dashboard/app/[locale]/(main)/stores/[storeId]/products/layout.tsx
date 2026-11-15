import type { ReactNode } from "react";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { ProductStoreProvider } from "./_components/product-store.client";
import { PendingProductSavedToast } from "./_components/product-saved-toast.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Gives every Products page the store it acts on (ROADMAP.md F-87c slice 2):
 * the `[storeId]` segment, after loadStorePage has checked it against the
 * session (a foreign, deleted or forged store is a 404). Pages and actions
 * still check it themselves (requireProductStore): a layout is not a guard.
 */
export default async function ProductsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  return (
    <ProductStoreProvider storeId={store.id}>
      {children}
      {/* The "product added" toast after the add form's full page load. */}
      <PendingProductSavedToast />
    </ProductStoreProvider>
  );
}
