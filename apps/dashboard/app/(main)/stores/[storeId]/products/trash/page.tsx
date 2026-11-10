import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { listTrashedProducts } from "@workspace/lib/products/trash/server";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { ProductTrash } from "./trash.client";

// The seller's own products: never cached.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products.trash");
  return { title: t("pageTitle"), description: t("subtitle") };
}

/** Products › Trash (0123, ROADMAP.md F-35): restore within 30 days, or delete for good. */
export default async function ProductTrashPage({ params }: { params: Promise<{ storeId: string }> }) {
  // The URL store's Trash only (F-87c slice 2); a foreign or forged store is a 404.
  const { seller, inStore } = await loadProductStorePage((await params).storeId);
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const items = await listTrashedProducts(seller.sellerId, locale, { inStore });

  return (
    <PageContainer narrow>
      <ProductTrash items={items} />
    </PageContainer>
  );
}
