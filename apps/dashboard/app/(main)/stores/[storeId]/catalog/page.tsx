import { notFound } from "next/navigation";
import { STORE_CATALOG_MAX_PRODUCTS } from "@workspace/lib/stores";
import { getStoreCatalog } from "@workspace/lib/stores/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadCatalogProducts } from "./catalog.data";
import { StoreCatalogForm } from "./catalog.client";

export default async function StoreCatalogPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const [catalog, products] = await Promise.all([
    getStoreCatalog(store.sellerId, store.id),
    loadCatalogProducts(store.sellerId, store.id),
  ]);
  if (!catalog) notFound();

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreCatalogForm
        storeId={store.id}
        initialMode={catalog.mode}
        initialSelected={catalog.productIds}
        products={products}
        maxProducts={STORE_CATALOG_MAX_PRODUCTS}
        readOnly={store.status !== "active"}
      />
    </section>
  );
}
