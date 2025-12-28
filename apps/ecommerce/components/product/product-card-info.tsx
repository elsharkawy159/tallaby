import { Star } from "lucide-react";
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
          <h3 className="md:text-sm text-xs font-medium md:line-clamp-2 line-clamp-1">
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
