import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { listTrashedProducts } from "@workspace/lib/products/trash/server";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { ProductTrash } from "./trash.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products.trash");
  return { title: t("pageTitle"), description: t("subtitle") };
}

/**
 * Store settings › Trash (0123, ROADMAP.md F-35; moved from Products, owner
 * 2026-11-27): restore within 30 days, or delete for good. The URL store's
 * Trash only; a foreign or forged store is a 404.
 */
export default async function StoreTrashPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { seller, store, inStore } = await loadProductStorePage((await params).storeId);
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const items = await listTrashedProducts(seller.sellerId, locale, { inStore });

  return <ProductTrash storeId={store.id} items={items} />;
}
