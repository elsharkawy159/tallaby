import { Star } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";

interface ProductInfoProps {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  inStock: boolean;
}

export const ProductInfo = ({
  name,
  price,
  originalPrice,
  rating,
  reviewCount,
  description,
  inStock,
}: ProductInfoProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              ({reviewCount} reviews)
            </span>
          </div>
          <Badge variant={inStock ? "default" : "destructive"}>
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-primary">${price}</span>
          {originalPrice && (
            <span className="text-xl text-gray-500 line-through">
              ${originalPrice}
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};
