import { Star } from "lucide-react";
import { formatPrice } from "@workspace/lib";
import { useLocale } from "next-intl";
import type { ProductCardProps } from "./product-card.types";
import Link from "next/link";

interface ProductCardInfoProps {
  product: ProductCardProps;
  className?: string;
}

function resolvePrice(product: ProductCardProps) {
  // new API shape: price as object
  if (product && typeof product.price === "object" && product.price !== null) {
    const p = product.price as NonNullable<ProductCardProps["price"]> & any;
    const value = p.final ?? p.base ?? p.list;
    if (typeof value === "number") return value;
  }
  // demo shape: price as number
  if (typeof product?.price === "number") return product.price as number;
  // legacy shape: base/sale
  if (typeof product?.sale_price === "number")
    return product.sale_price as number;
  if (typeof product?.base_price === "number")
    return product.base_price as number;
  return 0;
}

export const ProductCardInfo = ({
  product,
  className,
}: ProductCardInfoProps) => {
  const locale = useLocale();
  const title = product.title || product.name || "Untitled Product";
  const price = resolvePrice(product);

  const rating =
    (typeof product.average_rating === "number"
      ? product.average_rating
      : null) ??
    (typeof product.averageRating === "number"
      ? product.averageRating
      : null) ??
    0;
  const reviews = product.review_count ?? product.reviewCount ?? 0;

  return (
    <div
      className={`md:block flex justify-between items-center md:mt-2.5 mt-1.5 ${className}`}
    >
      <div className="flex md:flex-row flex-col md:items-center md:gap-4.5 gap-1 justify-between">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium md:line-clamp-2 line-clamp-1">
            {title}
          </h3>
        </Link>
        <span
          className="md:text-lg text-sm font-semibold"
          dangerouslySetInnerHTML={{ __html: formatPrice(price, locale) }}
        />
      </div>
    </div>
  );
};
