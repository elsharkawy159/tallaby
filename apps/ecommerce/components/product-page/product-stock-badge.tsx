"use client";

import { useTranslations } from "next-intl";

interface ProductStockBadgeProps {
  hasStock: boolean;
  isLowStock: boolean;
  stock: number;
}

/** Out of stock, only N left, or in stock, as a small pill. */
export const ProductStockBadge = ({ hasStock, isLowStock, stock }: ProductStockBadgeProps) => {
  const t = useTranslations("product");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        !hasStock
          ? "bg-red-50 text-red-600"
          : isLowStock
            ? "bg-[#fff4de] text-[#9a5800]"
            : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          !hasStock
            ? "bg-red-500"
            : isLowStock
              ? "bg-accent"
              : "bg-emerald-500"
        }`}
      />
      {!hasStock
        ? t("outOfStock")
        : isLowStock
          ? t("onlyLeft", { count: stock })
          : t("inStockAvailable", { count: stock })}
    </span>
  );
};
