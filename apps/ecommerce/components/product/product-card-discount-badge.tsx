"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ProductCardDiscountBadgeProps {
  percent: number;
  className?: string;
}

export const ProductCardDiscountBadge = ({
  percent,
  className,
}: ProductCardDiscountBadgeProps) => {
  const t = useTranslations("product");

  if (percent <= 0) return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute top-1.5 start-1.5 z-20",
        "inline-flex items-center justify-center",
        "rounded-md px-1.5 py-0.5 md:px-2 md:py-1",
        "bg-primary text-primary-foreground",
        "text-[10px] font-bold leading-none tracking-tight md:text-xs",
        "shadow-sm ring-1 ring-black/5",
        className
      )}
      aria-label={t("discountPercentOff", { percent })}
    >
      −{percent}%
    </span>
  );
};
