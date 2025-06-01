import { Heart, Star, ShoppingCart, Badge as BadgeIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  brand: string;
  name: string;
  feature: string;
  model: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badges?: string[];
  isWishlisted?: boolean;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
}

const ProductCard = ({
  id,
  brand,
  name,
  feature,
  model,
  slug,
  price,
  originalPrice,
  rating,
  reviewCount,
  image,
  badges = [],
}: ProductCardProps) => {
  // const { addToCart } = useCart();
  // const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const discountPercentage = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  // const wishlistStatus = isInWishlist(id);

  // const handleAddToCart = () => {
  //   addToCart(id, 1);
  // };

  // const handleToggleWishlist = () => {
  //   if (wishlistStatus) {
  //     removeFromWishlist(id);
  //   } else {
  //     addToWishlist(id);
  //   }
  // };

  const fullProductTitle = `${brand} ${name} ${feature} ${model}`.trim();

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-50">
          <Link href={`/product/${slug}`}>
            <img
              src={image}
              alt={fullProductTitle}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            />
          </Link>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm`}
            // onClick={handleToggleWishlist}
          >
            <Heart
              className={`h-4 w-4`}
            />
          </Button>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white">
              -{discountPercentage}%
            </Badge>
          )}

          {/* Product Badges */}
          {badges.length > 0 && (
            <div className="absolute top-12 left-2 flex flex-col gap-1">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-semibold"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <Link href={`/product/${slug}`}>
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-primary cursor-pointer text-sm leading-tight">
              {fullProductTitle}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-2">
              {rating} ({reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">${price}</span>
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ${originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            // onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
