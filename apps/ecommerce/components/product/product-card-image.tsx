"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProductCardProps } from "./product-card.types";
import { resolvePrimaryImage } from "@/lib/utils";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { cn } from "@/lib/utils";

interface ProductCardImageProps {
  product: ProductCardProps;
  className?: string;
  hoverImage?: string | null;
}

export const ProductCardImage = ({
  product,
  className,
  hoverImage,
}: ProductCardImageProps) => {
  const slug = product.slug || "unknown-product";
  const title = product.title || product.name || "Untitled Product";
  const productImage = resolvePrimaryImage(product.images);

  // Keep the last non-null hover image around while the overlay fades out,
  // so the swap doesn't pop back to the base image mid-transition.
  const [lastHoverImage, setLastHoverImage] = useState<string | null>(null);

  useEffect(() => {
    if (hoverImage) setLastHoverImage(hoverImage);
  }, [hoverImage]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/20 p-1.5 md:p-2",
        className
      )}
    >
      <Link href={`/products/${slug}`} className="relative block">
        <ImageWithFallback
          src={productImage}
          alt={title}
          width={270}
          height={310}
          loading="lazy"
          className={cn(
            "aspect-[2.6/3] h-full w-full object-contain transition-opacity duration-300",
            hoverImage ? "opacity-0" : "opacity-100"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        {lastHoverImage && (
          <ImageWithFallback
            src={lastHoverImage}
            alt={title}
            width={270}
            height={310}
            className={cn(
              "absolute inset-0 aspect-[2.6/3] object-contain transition-opacity duration-300",
              hoverImage ? "opacity-100" : "opacity-0"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        )}
      </Link>
    </div>
  );
};
