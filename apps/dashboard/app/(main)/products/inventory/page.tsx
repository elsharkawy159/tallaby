import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
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
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[] }>;
}) {
  const seller = await requireSeller().catch((error) => error);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const productId = selectedProductParam((await searchParams).product);

  const [lowStock, selected] = await Promise.all([
    listLowStock(seller.sellerId, locale),
    productId ? getProductInventory(seller.sellerId, seller.userId, productId, locale) : Promise.resolve(null),
  ]);

  return (
    <section className="p-4 sm:p-6">
      <InventoryPage lowStock={lowStock} selected={selected} />
    </section>
  );
}
