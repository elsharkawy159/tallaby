"use client";

import { formatPrice } from "@workspace/lib";
import { useLocale } from "next-intl";
import type { ProductCardProps } from "./product-card.types";
import Link from "next/link";
import { resolvePrice } from "@/lib/utils";

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

  return (
    <div
      className={`flex items-center justify-between gap-2 ${className ?? ""}`}
    >
      <Link
        href={`/products/${product.slug}`}
        className="min-w-0 flex-1"
      >
        <h3 className="line-clamp-2 text-xs font-medium text-gray-900 md:text-sm">
          {title}
        </h3>
      </Link>
      <p
        className="shrink-0 text-sm font-semibold text-gray-900 md:text-lg"
        dangerouslySetInnerHTML={{ __html: formatPrice(price, locale) }}
      />
    </div>
  );
};
