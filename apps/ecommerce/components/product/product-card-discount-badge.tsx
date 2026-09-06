"use client";

import { DiscountPercentBadge } from "./discount-percent-badge";
import { cn } from "@/lib/utils";

interface ProductCardDiscountBadgeProps {
  percent: number;
  className?: string;
}

export const ProductCardDiscountBadge = ({
  percent,
  className,
}: ProductCardDiscountBadgeProps) => {
  return (
    <DiscountPercentBadge
      percent={percent}
      className={cn(
        "pointer-events-none absolute top-1.5 start-1.5 z-20",
        className
      )}
    />
  );
};
