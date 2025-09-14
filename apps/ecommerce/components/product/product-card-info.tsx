import { Star } from "lucide-react";
import type { ProductCardProps } from "./product-card.types";

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
    <div className={`space-y-2 mt-2.5 ${className}`}>
      <div className="flex items-center gap-4.5 justify-between mb-2">
        <h3 className="text-base font-medium line-clamp-2">{title}</h3>
        <span className="text-lg font-semibold">${price}</span>
      </div>

      {/* Rating */}
      <div className="flex text-sm items-center gap-1">
        <span className="font-medium">{rating}</span>
        <Star className="h-4 w-4 text-yellow-400 fill-current" />
        <span className="text-gray-500">({reviews})</span>
      </div>
    </div>
  );
};
