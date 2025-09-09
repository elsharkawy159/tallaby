import Link from "next/link";
import { getTopCategories } from "@/actions/categories";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryCarouselProps {
  title?: string;
  limit?: number;
  showProductCount?: boolean;
  className?: string;
}

export default async function CategoryCarousel({
  title = "Browse Categories",
  limit = 12,
  showProductCount = true,
  className = "",
}: CategoryCarouselProps) {
  const result = await getTopCategories();
  const categories = result.success ? result.data?.slice(0, limit) : [];

  if (!categories?.length) {
    return null;
  }

  return (
    <section className={`py-8 container mx-auto ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      )}

      <div className="relative group">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group flex-shrink-0"
            >
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors min-w-[120px]">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {category.name?.charAt(0).toUpperCase()}
                </div>

                <div className="text-center">
                  <h4 className="font-medium text-gray-900 text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </h4>

                  {showProductCount && category.productCount && (
                    <p className="text-xs text-gray-500 mt-1">
                      {category.productCount} products
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          //   onClick={() => {
          //     const container = document.querySelector('.overflow-x-auto')
          //     if (container) {
          //       container.scrollBy({ left: -200, behavior: 'smooth' })
          //     }
          //   }}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          //   onClick={() => {
          //     const container = document.querySelector('.overflow-x-auto')
          //     if (container) {
          //       container.scrollBy({ left: 200, behavior: 'smooth' })
          //     }
          //   }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
