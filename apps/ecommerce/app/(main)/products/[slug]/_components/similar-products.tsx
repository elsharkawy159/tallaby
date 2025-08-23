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
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Similar Products</h2>
          <Button variant="outline">View More</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>

                  {/* Quick Add to Cart */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button className="w-full h-10 text-sm font-semibold">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Quick Add
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-primary">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
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
