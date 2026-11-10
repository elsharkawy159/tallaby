import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { getProductInventory, listLowStock } from "./inventory.data";
import { selectedProductParam } from "./inventory.lib";
import { InventoryPage } from "./inventory.client";

// The seller's own stock: never cached.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products.inventory");
  return { title: t("pageTitle"), description: t("subtitle") };
}

/** Products › Inventory (0125, ROADMAP.md F-10c): low stock, quick restock, stock history. */
export default async function ProductInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ product?: string | string[] }>;
}) {
  // The URL store's stock only (F-87c slice 2); a foreign or forged store is a 404.
  const { seller, inStore } = await loadProductStorePage((await params).storeId);
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const productId = selectedProductParam((await searchParams).product);

  const [lowStock, selected] = await Promise.all([
    listLowStock(seller.sellerId, inStore, locale),
    productId ? getProductInventory(seller.sellerId, inStore, seller.userId, productId, locale) : Promise.resolve(null),
  ]);

  return (
    <PageContainer narrow>
      <InventoryPage lowStock={lowStock} selected={selected} />
    </PageContainer>
  );
}
