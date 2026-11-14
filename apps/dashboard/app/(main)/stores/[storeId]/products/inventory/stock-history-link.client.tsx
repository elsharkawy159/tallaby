"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { SellerButton } from "@/components/seller-ui";
import { useProductsHref } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";

/**
 * "Stock history" on the product edit page → Products › Inventory for this product (F-10c).
 * An icon on phones (inside PHONE_COMPACT_ACTIONS); the label stays for screen readers.
 */
export function StockHistoryLink({ productId }: { productId: string }) {
  const t = useTranslations("products.inventory");
  const productsHref = useProductsHref();
  return (
    <SellerButton asChild variant="outline">
      <Link
        href={productsHref(`/inventory?product=${encodeURIComponent(productId)}`)}
        title={t("historyFor")}
        data-phone-icon
      >
        <History aria-hidden />
        <span className="max-[600px]:sr-only">{t("historyFor")}</span>
      </Link>
    </SellerButton>
  );
}
