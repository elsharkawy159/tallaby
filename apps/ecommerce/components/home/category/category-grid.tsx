import Link from "next/link";
import { getTopCategories } from "@/actions/categories";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";

interface CategoryGridProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showProductCount?: boolean;
  className?: string;
}

export default async function CategoryGrid({
  title = "Shop by Category",
  subtitle = "Discover products in your favorite categories",
  limit = 8,
  showProductCount = true,
  className = "",
}: CategoryGridProps) {
  const result = await getTopCategories();
  const categories =
    result.success && result.data ? result.data.slice(0, limit) : [];
  if (!categories.length) {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {category.name?.charAt(0).toUpperCase()}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>

                {showProductCount && category.productCount && (
                  <Badge variant="secondary" className="text-xs">
                    {category.productCount} products
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/categories"
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All Categories
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
