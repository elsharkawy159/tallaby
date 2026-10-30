"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

/** "Stock history" on the product edit page → Products › Inventory for this product (F-10c). */
export function StockHistoryLink({ productId }: { productId: string }) {
  const t = useTranslations("products.inventory");
  return (
    <Button asChild size="sm" variant="outline">
      <Link href={`/products/inventory?product=${encodeURIComponent(productId)}`}>
        <History aria-hidden />
        {t("historyFor")}
      </Link>
    </Button>
  );
}
