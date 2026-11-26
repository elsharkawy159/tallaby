import type { ReactNode } from "react";
import { ProductStoreProvider } from "./_components/product-store.client";
import { PendingProductSavedToast } from "./_components/product-saved-toast.client";

/**
 * Gives every Products page the store it acts on (ROADMAP.md F-87c slice 2):
 * the `[storeId]` segment, as a promise the client consumers unwrap with
 * `use()`. The layout awaits nothing, so the products `loading.tsx` skeletons
 * are in the static shell (docs/plans/dashboard-performance.md B4). It is not
 * a guard: every page checks the store against the session itself
 * (loadProductStorePage: a foreign, deleted or forged store is a 404), and
 * every action does too (requireProductStore).
 */
export default function ProductsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const storeId = params.then((p) => p.storeId);
  return (
    <ProductStoreProvider storeId={storeId}>
      {children}
      {/* The "product added" toast after the add form's full page load. */}
      <PendingProductSavedToast />
    </ProductStoreProvider>
  );
}
