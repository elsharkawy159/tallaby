import { Star } from "lucide-react";
import type { ProductCardProps } from "./product-card.types";

interface ProductReviewProps {
  product: ProductCardProps;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export const ProductReview = ({
  product,
  className,
  size = "default",
}: ProductReviewProps) => {
  const rating =
    (typeof product.average_rating === "number"
      ? product.average_rating
      : null) ??
    (typeof product.averageRating === "number"
      ? product.averageRating
      : null) ??
    0;

  const reviews = product.review_count ?? product.reviewCount ?? 0;

  // Don't render if no rating or reviews
  if (rating === 0 && reviews === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  };

  const starSizeClasses = {
    sm: "size-3",
    default: "size-4",
    lg: "size-5",
  };

  return (
    <div
      className={`flex items-center gap-1 justify-end ltr:justify-start ${sizeClasses[size]} ${className}`}
    >
      <span className="font-medium">{rating.toFixed(1)}</span>
      <Star
        className={`${starSizeClasses[size]} text-yellow-400 fill-current`}
      />
      <span className="text-gray-500">({reviews})</span>
    </div>
  );
};
