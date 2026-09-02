import { Skeleton } from "@workspace/ui/components/skeleton";

export const SimilarProductsSkeleton = () => {
  return (
    <section className="bg-white py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow-sm border-0 p-0 relative overflow-hidden rounded-lg"
            >
              <div className="p-0">
                {/* Product Image Skeleton */}
                <div className="relative aspect-square overflow-hidden">
                  <Skeleton className="w-full h-full" />

                  {/* Wishlist Button Skeleton */}
                  <div className="absolute top-3 right-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>

                  {/* Quick Add to Cart Skeleton */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Skeleton className="w-full h-10 rounded-lg" />
                  </div>
                </div>

                {/* Product Info Skeleton */}
                <div className="p-4 space-y-3">
                  <div>
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-2" />

                    {/* Price Skeleton */}
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>

                    {/* Rating Skeleton */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Skeleton key={j} className="h-3 w-3 rounded" />
                        ))}
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
