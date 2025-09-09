import Link from "next/link";
import { getPopularBrands } from "@/actions/brands";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

interface ShopByBrandProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showProductCount?: boolean;
  showRating?: boolean;
  layout?: "grid" | "carousel";
  className?: string;
}

export default async function ShopByBrand({
  title = "Shop by Brand",
  subtitle = "Discover products from your favorite brands",
  limit = 12,
  showProductCount = true,
  showRating = true,
  layout = "grid",
  className = "",
}: ShopByBrandProps) {
  const result = await getPopularBrands();
  const brands = result.success ? result.data.slice(0, limit) : [];

  if (!brands.length) {
    return null;
  }

  return (
    <section className={`lg:py-8 py-5 container mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      {layout === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  {brand.logoUrl ? (
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors text-sm">
                    {brand.name}
                  </h3>

                  <div className="space-y-1">
                    {showProductCount && brand.productCount && (
                      <Badge variant="secondary" className="text-xs">
                        {brand.productCount} products
                      </Badge>
                    )}

                    {showRating && brand.averageRating && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <span>★</span>
                        <span>{brand.averageRating.toFixed(1)}</span>
                        {brand.reviewCount && (
                          <span>({brand.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="group flex-shrink-0"
            >
              <Card className="w-48 hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <CardContent className="p-4 text-center">
                  {brand.logoUrl ? (
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors text-sm">
                    {brand.name}
                  </h3>

                  {showProductCount && brand.productCount && (
                    <Badge variant="secondary" className="text-xs">
                      {brand.productCount} products
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/brands"
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All Brands
          <svg
            className="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
