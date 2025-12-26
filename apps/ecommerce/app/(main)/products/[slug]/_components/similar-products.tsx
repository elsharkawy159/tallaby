import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import ProductCard from "./ProductCard";
import Link from "next/link";

interface SimilarProductsProps {
  products?: any[];
  cartItems?: any[];
  wishlistItems?: any[];
}

export const SimilarProducts = ({
  products,
  cartItems = [],
  wishlistItems = [],
}: SimilarProductsProps) => {
  if (!products || products.length === 0) return null;

  // Create maps for quick lookup
  const cartProductIds = new Set(
    cartItems
      .filter((item: any) => !item.savedForLater)
      .map((item: any) => item.productId)
  );
  const wishlistMap = new Map(
    wishlistItems.map((item: any) => [item.productId, item.id])
  );

  return (
    <section className="py-8 lg:py-12">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-3xl font-bold text-gray-900">
            Customers also purchased
          </h2>
          <Button variant="outline" className="w-fit">
            <Link href="/products"> View More</Link>
          </Button>
        </div>
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="relative"
        >
          <CarouselContent className="">
            {products.map((product) => (
              <CarouselItem key={product.id} className="basis-auto">
                <ProductCard
                  {...product}
                  isInCart={cartProductIds.has(product.id)}
                  isInWishlist={wishlistMap.has(product.id)}
                  wishlistItemId={wishlistMap.get(product.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>
      </div>
    </section>
  );
};
