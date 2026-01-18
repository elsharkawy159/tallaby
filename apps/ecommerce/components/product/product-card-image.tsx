import Image from "next/image";
import Link from "next/link";
import type { ProductCardProps } from "./product-card.types";
import { resolvePrimaryImage } from "@/lib/utils";

interface ProductCardImageProps {
  product: ProductCardProps;
  className?: string;
}



export const ProductCardImage = ({
  product,
  className,
}: ProductCardImageProps) => {
  const slug = product.slug || "unknown-product";
  const title = product.title || product.name || "Untitled Product";
  const productImage = resolvePrimaryImage(product.images);

  return (
    <div className={`relative rounded-md overflow-hidden p-2 ${className}`}>
      <Link href={`/products/${slug}`}>
        <Image
          src={productImage}
          alt={title}
          width={270}
          height={310}
          loading="lazy"
          className="w-full aspect-[2.6/3] h-full object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
      </Link>
    </div>
  );
};
