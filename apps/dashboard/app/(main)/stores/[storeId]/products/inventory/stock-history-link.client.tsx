"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { SellerButton } from "@/components/seller-ui";
import { useProductsHref } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";

/** "Stock history" on the product edit page → Products › Inventory for this product (F-10c). */
export function StockHistoryLink({ productId }: { productId: string }) {
  const t = useTranslations("products.inventory");
  const productsHref = useProductsHref();
  return (
    <SellerButton asChild variant="outline">
      <Link href={productsHref(`/inventory?product=${encodeURIComponent(productId)}`)}>
        <History aria-hidden />
        {t("historyFor")}
      </Link>
    </SellerButton>
  );
}
