import { Star } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { ProductImages } from "./ProductImages";
import type { Product } from "../product-page.types";

interface ProductHeroProps {
  product: Product;
}

export const ProductHero = ({ product }: ProductHeroProps) => {
  console.log("product", product);
  return (
    <>
      {/* Product Images */}
      <div className="w-full sticky top-5 h-full">
        <ProductImages images={product.images} productName={product.title} />
      </div>

      {/* Product Info */}
      <div className="space-y-4 lg:space-y-6 w-full">
        {/* Product Title and Rating */}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
            {product.title}
          </h1>

          {/* Rating and Reviews */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      i < Math.floor(product.averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-base lg:text-lg font-semibold text-gray-900">
                {product.averageRating}
              </span>
              <span className="text-sm lg:text-base text-gray-600">
                ({product.reviewCount})
              </span>
            </div>

            <Badge variant={product.isActive ? "default" : "destructive"}>
              {product.isActive ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
              ${product.price.base}
            </span>
            {product.price.discountType && (
              <span className="text-lg sm:text-xl lg:text-2xl text-gray-500 line-through">
                ${product.price.final}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Key Features */}
        {product.bulletPoints && product.bulletPoints.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
              Key Features
            </h3>
            <ul className="space-y-2">
              {product.bulletPoints.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm sm:text-base text-gray-700"
                >
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Color Selection */}
        {Array.isArray((product as any).colors) &&
          (product as any).colors.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                Colors: {(product as any).colors?.[0]?.name}
              </h3>
              <div className="flex gap-2 sm:gap-3">
                {(product as any).colors.map((color: any) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                      (product as any).colors?.[0]?.name === color.name
                        ? "border-primary scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

        {/* Size Selection */}
        {Array.isArray((product as any).sizes) &&
          (product as any).sizes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                Sizes
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {(product as any).sizes.map((size: any) => (
                  <button
                    key={size}
                    className={`px-3 py-2 sm:px-4 sm:py-2 border rounded-lg transition-all text-sm sm:text-base ${
                      (product as any).sizes?.[0] === size
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>
    </>
  );
};
