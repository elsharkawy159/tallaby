import Image from "next/image";
import Link from "next/link";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import type { ProductCardProps } from "./product-card.types";

interface ProductCardImageProps {
  product: ProductCardProps;
  className?: string;
}

const fallbackImage = "/png product.png";

function resolvePrimaryImage(images?: ProductCardProps["images"]) {
  if (!images || images.length === 0) return fallbackImage;
  const first = images[0] as any;
  const key = typeof first === "string" ? first : first?.url;
  if (!key || typeof key !== "string") return fallbackImage;
  return getPublicUrl(key, "products");
}

export const ProductCardImage = ({
  product,
  className,
}: ProductCardImageProps) => {
  const slug = product.slug || "unknown-product";
  const title = product.title || product.name || "Untitled Product";
  const productImage = resolvePrimaryImage(product.images);

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`}>
      <Link href={`/products/${slug}`}>
        <Image
          src={productImage}
          alt={title}
          width={270}
          height={310}
          loading="lazy"
          className="w-full aspect-[2.6/3] h-full object-contain bg-white"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
      </Link>
    </div>
  );
};
