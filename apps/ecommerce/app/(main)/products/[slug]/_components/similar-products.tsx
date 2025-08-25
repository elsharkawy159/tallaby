import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import Link from "next/link";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";

interface SimilarProductsProps {
  productId: string;
}

// Mock data - in real app, this would come from API
const mockSimilarProducts = [
  {
    id: "1",
    name: "Premium Cotton T-Shirt",
    price: 29.99,
    originalPrice: 39.99,
    rating: 4.5,
    reviewCount: 128,
    image: "/products/similar-1.jpg",
    slug: "premium-cotton-tshirt",
  },
  {
    id: "2",
    name: "Classic Polo Shirt",
    price: 34.99,
    originalPrice: 44.99,
    rating: 4.3,
    reviewCount: 95,
    image: "/products/similar-2.jpg",
    slug: "classic-polo-shirt",
  },
  {
    id: "3",
    name: "Casual Henley Shirt",
    price: 27.99,
    originalPrice: 37.99,
    rating: 4.7,
    reviewCount: 156,
    image: "/products/similar-3.jpg",
    slug: "casual-henley-shirt",
  },
  {
    id: "4",
    name: "Slim Fit Dress Shirt",
    price: 49.99,
    originalPrice: 59.99,
    rating: 4.2,
    reviewCount: 87,
    image: "/products/similar-4.jpg",
    slug: "slim-fit-dress-shirt",
  },
];

export const SimilarProducts = ({ productId }: SimilarProductsProps) => {
  return (
    <section className="bg-white py-8 lg:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-3xl font-bold text-gray-900">
            Similar Products
          </h2>
          <Button variant="outline" className="w-fit">
            View More
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {mockSimilarProducts.map((product) => (
            <Card
              key={product.id}
              className="group bg-white shadow-sm border-0 p-0 relative overflow-hidden rounded-lg hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Link href={`/products/${product.slug}`}>
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        Product Image
                      </span>
                    </div>
                  </Link>

                  {/* Wishlist Button */}
                  <button className="absolute top-2 right-2 lg:top-3 lg:right-3 w-6 h-6 lg:w-8 lg:h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors">
                    <Heart className="h-3 w-3 lg:h-4 lg:w-4 text-gray-600" />
                  </button>

                  {/* Quick Add to Cart */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 lg:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button className="w-full h-8 lg:h-10 text-xs lg:text-sm font-semibold">
                      <ShoppingCart className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                      Quick Add
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-2 lg:p-4 space-y-2 lg:space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 lg:mb-2 text-sm lg:text-base">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                      <span className="text-base lg:text-lg font-bold text-primary">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs lg:text-sm text-gray-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 lg:gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 lg:h-3 lg:w-3 ${
                              i < Math.floor(product.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs lg:text-sm text-gray-600">
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
