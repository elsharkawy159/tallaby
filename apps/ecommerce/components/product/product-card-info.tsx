"use client";

import { formatPrice } from "@workspace/lib";
import { useLocale } from "next-intl";
import type { ProductCardProps } from "./product-card.types";
import { Link } from "@/i18n/navigation";
import { cn, resolveListPrice, resolvePrice } from "@/lib/utils";

interface ProductCardInfoProps {
  product: ProductCardProps;
  className?: string;
}

export const ProductCardInfo = ({
  product,
  className,
}: ProductCardInfoProps) => {
  const locale = useLocale() as "en" | "ar";
  const title = product.title || product.name || "Untitled Product";
  const price = resolvePrice(product);
  const listPrice = resolveListPrice(product);
  const hasDiscount = listPrice != null && listPrice > price;

  return (
    <div className={cn("flex justify-between gap-2", className)}>
      <Link href={`/products/${product.slug}`} className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-xs font-medium text-gray-900 md:text-sm">
          {title}
        </h3>
      </Link>

      <div className="flex shrink-0 flex-col items-end gap-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold md:text-lg",
            hasDiscount ? "text-primary" : "text-gray-900",
          )}
          dangerouslySetInnerHTML={{ __html: formatPrice(price, locale) }}
        />
        {hasDiscount && (
          <p
            className="text-[11px] font-medium text-muted-foreground line-through leading-none decoration-muted-foreground/70 md:text-xs"
            dangerouslySetInnerHTML={{ __html: formatPrice(listPrice, locale) }}
          />
        )}
      </div>
    </div>
  );
};
